/**
 * Laxmi Puja Hybrid Database Management
 * Coordinates between Google Cloud Firebase (when configured) and local IndexedDB.
 * 
 * - When Firebase is Connected: Real-time public cloud sync for photos, updates, wishes, and likes.
 * - When Firebase is in Local Mode: 100% offline-ready persistent IndexedDB storage.
 */

class PujaDB {
  constructor() {
    this.dbName = 'LaxmiPujaDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    // 1. Initialize local IndexedDB first
    await new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Photos Store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', { keyPath: 'id' });
          photoStore.createIndex('category', 'category', { unique: false });
          photoStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Updates / Announcements Store
        if (!db.objectStoreNames.contains('updates')) {
          const updateStore = db.createObjectStore('updates', { keyPath: 'id' });
          updateStore.createIndex('category', 'category', { unique: false });
          updateStore.createIndex('timestamp', 'timestamp', { unique: false });
          updateStore.createIndex('isPinned', 'isPinned', { unique: false });
        }

        // Community Wishes Store
        if (!db.objectStoreNames.contains('wishes')) {
          const wishStore = db.createObjectStore('wishes', { keyPath: 'id' });
          wishStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // App Meta / Counter Store
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this.seedInitialDataIfNeeded();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });

    // 2. Initialize Firebase if configured
    if (window.firebaseService) {
      try {
        await window.firebaseService.init();
      } catch (err) {
        console.warn('Firebase initialization skipped or failed:', err);
      }
    }

    return this.db;
  }

  isCloudActive() {
    return !!(window.firebaseService && window.firebaseService.isReady);
  }

  // ==========================================
  // PHOTOS CRUD (Cloud / Local Hybrid)
  // ==========================================
  async getAllPhotos() {
    if (this.isCloudActive()) {
      try {
        const cloudPhotos = await window.firebaseService.getPhotos();
        if (cloudPhotos && cloudPhotos.length > 0) {
          return cloudPhotos;
        }
      } catch (err) {
        console.warn('Could not fetch photos from Firebase, falling back to local:', err);
      }
    }

    // Fallback to IndexedDB
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['photos'], 'readonly');
      const store = tx.objectStore('photos');
      const request = store.getAll();
      request.onsuccess = () => {
        const photos = request.result || [];
        photos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(photos);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async savePhoto(photo) {
    if (!photo.id) {
      photo.id = 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    if (!photo.timestamp) {
      photo.timestamp = new Date().toISOString();
    }
    if (typeof photo.likes !== 'number') {
      photo.likes = 0;
    }

    // Save to Firebase if active
    if (this.isCloudActive()) {
      try {
        await window.firebaseService.savePhoto(photo);
      } catch (err) {
        console.warn('Failed to save photo to Firebase, will save locally:', err);
      }
    }

    // Always cache locally in IndexedDB
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['photos'], 'readwrite');
      const store = tx.objectStore('photos');
      const request = store.put(photo);
      request.onsuccess = () => resolve(photo);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePhoto(photoId) {
    if (this.isCloudActive()) {
      try {
        await window.firebaseService.deletePhoto(photoId);
      } catch (err) {
        console.warn('Firebase delete photo error:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['photos'], 'readwrite');
      const store = tx.objectStore('photos');
      const request = store.delete(photoId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async toggleLikePhoto(photoId) {
    if (this.isCloudActive()) {
      try {
        const cloudLikes = await window.firebaseService.likePhoto(photoId);
        // Sync local cache
        const tx = this.db.transaction(['photos'], 'readwrite');
        const store = tx.objectStore('photos');
        const getReq = store.get(photoId);
        getReq.onsuccess = () => {
          if (getReq.result) {
            getReq.result.likes = cloudLikes;
            store.put(getReq.result);
          }
        };
        return cloudLikes;
      } catch (err) {
        console.warn('Firebase like failed, updating locally:', err);
      }
    }

    // Local IndexedDB update
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['photos'], 'readwrite');
      const store = tx.objectStore('photos');
      const getReq = store.get(photoId);

      getReq.onsuccess = () => {
        const photo = getReq.result;
        if (!photo) return resolve(null);
        photo.likes = (photo.likes || 0) + 1;
        const putReq = store.put(photo);
        putReq.onsuccess = () => resolve(photo.likes);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ==========================================
  // UPDATES CRUD ("diffarent types of update")
  // ==========================================
  async getAllUpdates() {
    if (this.isCloudActive()) {
      try {
        const cloudUpdates = await window.firebaseService.getUpdates();
        if (cloudUpdates && cloudUpdates.length > 0) {
          return cloudUpdates;
        }
      } catch (err) {
        console.warn('Could not fetch updates from Firebase, falling back to local:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['updates'], 'readonly');
      const store = tx.objectStore('updates');
      const request = store.getAll();
      request.onsuccess = () => {
        const updates = request.result || [];
        updates.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        resolve(updates);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveUpdate(update) {
    if (!update.id) {
      update.id = 'update_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    if (!update.timestamp) {
      update.timestamp = new Date().toISOString();
    }
    if (typeof update.likes !== 'number') {
      update.likes = 0;
    }

    if (this.isCloudActive()) {
      try {
        await window.firebaseService.saveUpdate(update);
      } catch (err) {
        console.warn('Failed to save update to Firebase, saving locally:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['updates'], 'readwrite');
      const store = tx.objectStore('updates');
      const request = store.put(update);
      request.onsuccess = () => resolve(update);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteUpdate(updateId) {
    if (this.isCloudActive()) {
      try {
        await window.firebaseService.deleteUpdate(updateId);
      } catch (err) {
        console.warn('Firebase delete update error:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['updates'], 'readwrite');
      const store = tx.objectStore('updates');
      const request = store.delete(updateId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async toggleLikeUpdate(updateId) {
    if (this.isCloudActive()) {
      try {
        const cloudLikes = await window.firebaseService.likeUpdate(updateId);
        // Sync local cache
        const tx = this.db.transaction(['updates'], 'readwrite');
        const store = tx.objectStore('updates');
        const getReq = store.get(updateId);
        getReq.onsuccess = () => {
          if (getReq.result) {
            getReq.result.likes = cloudLikes;
            store.put(getReq.result);
          }
        };
        return cloudLikes;
      } catch (err) {
        console.warn('Firebase like update failed, updating locally:', err);
      }
    }

    // Local IndexedDB update
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['updates'], 'readwrite');
      const store = tx.objectStore('updates');
      const getReq = store.get(updateId);

      getReq.onsuccess = () => {
        const update = getReq.result;
        if (!update) return resolve(null);
        update.likes = (update.likes || 0) + 1;
        const putReq = store.put(update);
        putReq.onsuccess = () => resolve(update.likes);
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // ==========================================
  // WISHES CRUD
  // ==========================================
  async getAllWishes() {
    if (this.isCloudActive()) {
      try {
        const cloudWishes = await window.firebaseService.getWishes();
        if (cloudWishes && cloudWishes.length > 0) {
          return cloudWishes;
        }
      } catch (err) {
        console.warn('Could not fetch wishes from Firebase, falling back to local:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['wishes'], 'readonly');
      const store = tx.objectStore('wishes');
      const request = store.getAll();
      request.onsuccess = () => {
        const wishes = request.result || [];
        wishes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(wishes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveWish(wish) {
    if (!wish.id) {
      wish.id = 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    if (!wish.timestamp) {
      wish.timestamp = new Date().toISOString();
    }

    if (this.isCloudActive()) {
      try {
        await window.firebaseService.saveWish(wish);
      } catch (err) {
        console.warn('Failed to save wish to Firebase, saving locally:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['wishes'], 'readwrite');
      const store = tx.objectStore('wishes');
      const request = store.put(wish);
      request.onsuccess = () => resolve(wish);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteWish(wishId) {
    if (this.isCloudActive()) {
      try {
        await window.firebaseService.deleteWish(wishId);
      } catch (err) {
        console.warn('Firebase delete wish error:', err);
      }
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(['wishes'], 'readwrite');
      const store = tx.objectStore('wishes');
      const request = store.delete(wishId);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // ==========================================
  // COUNTERS
  // ==========================================
  async getCounter(key, defaultValue = 0) {
    if (this.isCloudActive()) {
      try {
        return await window.firebaseService.getCounter(key, defaultValue);
      } catch (e) {}
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['meta'], 'readonly');
      const store = tx.objectStore('meta');
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? req.result.value : defaultValue);
      };
      req.onerror = () => resolve(defaultValue);
    });
  }

  async incrementCounter(key) {
    if (this.isCloudActive()) {
      try {
        return await window.firebaseService.incrementCounter(key);
      } catch (e) {}
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction(['meta'], 'readwrite');
      const store = tx.objectStore('meta');
      const req = store.get(key);
      req.onsuccess = () => {
        const current = req.result ? req.result.value : 0;
        const next = current + 1;
        store.put({ key, value: next });
        resolve(next);
      };
      req.onerror = () => resolve(1);
    });
  }

  // ==========================================
  // EXPORT / IMPORT BACKUP
  // ==========================================
  async exportFullBackup() {
    const photos = await this.getAllPhotos();
    const updates = await this.getAllUpdates();
    const wishes = await this.getAllWishes();
    const diyas = await this.getCounter('diyas_lit', 108);

    const backup = {
      version: 2,
      appName: 'LaxmiPujaPublicGallery',
      firebaseProject: this.isCloudActive() ? window.firebaseService.config.projectId : 'local-indexeddb',
      exportedAt: new Date().toISOString(),
      diyas_lit: diyas,
      photos,
      updates,
      wishes
    };
    return JSON.stringify(backup, null, 2);
  }

  async importFullBackup(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.photos || !data.updates) {
        throw new Error('Invalid backup file format');
      }

      for (const p of data.photos) {
        await this.savePhoto(p);
      }
      for (const u of data.updates) {
        await this.saveUpdate(u);
      }
      if (data.wishes) {
        for (const w of data.wishes) {
          await this.saveWish(w);
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      throw e;
    }
  }

  // ==========================================
  // SEED INITIAL FESTIVE DATA
  // ==========================================
  async seedInitialDataIfNeeded() {
    const tx = this.db.transaction(['photos'], 'readonly');
    const store = tx.objectStore('photos');
    const req = store.count();

    req.onsuccess = async () => {
      if (req.result === 0) {
        const seedPhotos = [
          {
            id: 'photo_seed_1',
            title: 'Divine Pratima of Maa Mahalakshmi',
            category: 'Maa Lakshmi Idol / Pratima',
            photographer: 'Soumyadip Maity',
            caption: 'Kojagari Purnima Pratima adorned in auspicious Benarasi silk and gold ornaments, blessing our home mandap.',
            imageUrl: 'https://images.unsplash.com/photo-1603555501671-8f96b3fce8e4?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
            likes: 42
          },
          {
            id: 'photo_seed_2',
            title: 'Auspicious Alpona with Lokkhir Paa',
            category: 'Alpona Designs',
            photographer: 'Priyanka Mukherjee',
            caption: 'Traditional hand-drawn rice paste (Pithe bilati) alpona design welcoming Maa Lakshmi into the sanctum.',
            imageUrl: 'https://images.unsplash.com/photo-1574043443890-1ac0507d6d43?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
            likes: 38
          },
          {
            id: 'photo_seed_3',
            title: 'Chhappan Bhog & Naru Thali Offering',
            category: 'Bhog & Prasad',
            photographer: 'Anindita Das',
            caption: 'Special Kojagari Prasad thali: Narkel Naru, Til Naru, Khhoi, Moa, Chaler Payesh and seasonal fruits.',
            imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
            likes: 56
          },
          {
            id: 'photo_seed_4',
            title: 'Evening Sandhya Aarti & Glowing Diyas',
            category: 'Evening Aarti & Dhunuchi',
            photographer: 'Rajarshi Banerjee',
            caption: '108 earthen diyas and brass deepam lit during Sandhya Aarti with resonant shankha and bell chimes.',
            imageUrl: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
            likes: 67
          },
          {
            id: 'photo_seed_5',
            title: 'Illuminated Mandap Entrance Decoration',
            category: 'Mandap & Pandal',
            photographer: 'Debashis Roy',
            caption: 'Golden marigold garlands, mango leaves toran, and brass lamps welcoming devotees.',
            imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            likes: 29
          },
          {
            id: 'photo_seed_6',
            title: 'Community Pushpanjali Ritual',
            category: 'Family & Community',
            photographer: 'Subhamoy Sen',
            caption: 'Devotees offering red lotus flowers and chant prayers with utmost devotion on Kojagari night.',
            imageUrl: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
            likes: 45
          },
          {
            id: 'photo_seed_sports_1',
            title: 'আমফান (N.S.C.C) বার্ষিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা',
            category: '🏆 ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান',
            photographer: 'Amfan (N.S.C.C) ক্রীড়া ও সাংস্কৃতিক বিভাগ',
            caption: 'পাড়ার কচিকাঁচাদের নিয়ে আয়োজিত জমজমাট বাৎসরিক ক্রীড়া ও সাংস্কৃতিক প্রতিযোগিতা ও অনুষ্ঠান। বিজয়ীদের পুজো মণ্ডপে পুরস্কৃত করা হবে।',
            imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1000&q=80',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            likes: 72
          }
        ];

        const pTx = this.db.transaction(['photos'], 'readwrite');
        const pStore = pTx.objectStore('photos');
        seedPhotos.forEach(p => pStore.put(p));

        const seedUpdates = [
          {
            id: 'update_seed_sports_1',
            title: '🏆 আমফান (N.S.C.C) ক্লাব বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান সময়সূচী',
            category: 'cultural',
            priority: 'urgent',
            isPinned: true,
            author: 'Amfan (N.S.C.C) ক্রীড়া ও সাংস্কৃতিক কমিটি',
            body: `আমফান (N.S.C.C) ক্লাবের সকল সদস্য ও পাড়াবাসীদের জানানো যাচ্ছে:
আমাদের বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠান অনুষ্ঠিত হবে!
• ইভেন্টস: বিভিন্ন বয়সভিত্তিক দৌড়, বিস্কুট রেস, লেবু-চামচ ব্যালেন্স দৌড়, চিত্রাঙ্কন ও সাংস্কৃতিক পরিবেশনা।
• রিপোর্টিং টাইম: সকাল ৮:৩০ AM ক্লাব প্রাঙ্গণে।
• বিশেষ দ্রষ্টব্য: বিজয়ী প্রতিযোগীদের কোজাগরী লক্ষ্মী পূজার দিন সন্ধ্যায় মণ্ডপ মঞ্চে মেডেল ও ট্রফি প্রদান করা হবে।`,
            timestamp: new Date().toISOString()
          },
          {
            id: 'update_seed_1',
            title: '📅 আমফান (N.S.C.C) কোজাগরী লক্ষ্মী পূজা ও ৩ দিনব্যাপী পুণ্য নির্ঘণ্ট',
            category: 'schedule',
            priority: 'urgent',
            isPinned: true,
            author: 'আমফান (N.S.C.C) পুজো কমিটি',
            body: `আমফান (এন.এস.সি.সি) সার্বজনীন কোজাগরী লক্ষ্মী পূজা ও বার্ষিক ক্রীড়া ও সাংস্কৃতিক অনুষ্ঠানের দিনক্ষণ:

📌 বাংলা তারিখ:-
১৪, ১৫ ও ১৬ কার্তিক, ১৪৩৩

📌 ইংরেজি তারিখ:-
১, ২ ও ৩ নভেম্বর, ২০২৬

৩ দিনব্যাপী উৎসবের দিনপঞ্জি:
🗓️ রবিবার — ১ নভেম্বর, ২০২৬ (১৪ কার্তিক, ১৪৩৩):
পবিত্র শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা সূচনা, ঘট স্থাপন, দেবীর আরাধনা, মহা সন্ধ্যা আরতি ও পুষ্পাঞ্জলি।

🗓️ সোমবার — ২ নভেম্বর, ২০২৬ (১৫ কার্তিক, ১৪৩৩):
ক্লাবের বাৎসরিক ক্রীড়া প্রতিযোগিতা ও সাংস্কৃতিক অনুষ্ঠান। ভক্তদের মাঝে মহাভাব প্রসাদ বিতরণ।

🗓️ মঙ্গলবার — ৩ নভেম্বর, ২০২৬ (১৬ কার্তিক, ১৪৩৩):
বাৎসরিক সাংস্কৃতিক ও ক্রীড়া মেগা পুরস্কার বিতরণী পর্ব, সান্ধ্য সাংস্কৃতিক পরিবেশনা ও পূজা সমাপ্তি।

সকল ভক্ত ও এলাকাবাসীকে ক্লাবের তরফ থেকে সপরিবারে সাদর আমন্ত্রণ জানানো হচ্ছে।`,
            likes: 125,
            timestamp: new Date().toISOString()
          },
          {
            id: 'update_seed_2',
            title: '🍲 Mahabhog Distribution & Prasad Counter Schedule',
            category: 'bhog',
            priority: 'normal',
            isPinned: false,
            author: 'Bhog Committee',
            body: `The sacred Bhog prepared for Maa Lakshmi includes:
- Gobindobhog Chaler Khichuri
- Panch Thara Bhaja & Labra
- Chhanar Payesh
- Narkel Naru & Moa
Prasad distribution coupon counter opens near Mandap Gate 2 from 7:00 PM. Parcel prasad boxes are also arranged for elderly devotees.`,
            timestamp: new Date(Date.now() - 3600000 * 14).toISOString()
          },
          {
            id: 'update_seed_3',
            title: '📢 Notice: Photography & Mobile Upload Rules for Devotees',
            category: 'urgent',
            priority: 'urgent',
            isPinned: false,
            author: 'Media & Cultural Cell',
            body: `Devotees and visitors are warmly welcomed to take photos of the Pratima, Mandap, and Alpona!
You can click the "Upload Photo" button right here on this website to save and showcase your pictures to the public gallery instantly.
Please avoid flash photography right during the solemn Pushpanjali and Aarti hours.`,
            timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
          },
          {
            id: 'update_seed_4',
            title: '🎨 Traditional Alpona Competition Results Announced!',
            category: 'cultural',
            priority: 'normal',
            isPinned: false,
            author: 'Women\'s Wing Committee',
            body: `Congratulations to all participants in this year\'s traditional Rice Paste Alpona Competition!
🥇 1st Prize: Rina Sen & Group (Mandap Courtyard Section)
🥈 2nd Prize: Sneha Datta (Altar Entrance Lotus Motif)
🥉 3rd Prize: Tanusree Ghosh (Lokkhir Paa Heritage Style)
Winning designs are now showcased in the Photo Gallery under the "Alpona Designs" filter.`,
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: 'update_seed_5',
            title: '🪔 Kojagari "Ke Jagore" Night Awakening & Bhajan Recital',
            category: 'schedule',
            priority: 'normal',
            isPinned: false,
            author: 'Cultural Secretary',
            body: `In keeping with the sacred Kojagari tradition ("Ko Jāgarti" - Who is awake?), our Mandap will remain open through the night with devotional music, Laxmi Charitram recitation, and flute renditions from 11:00 PM to 4:00 AM. Hot tea and prasad will be served to all night-vigil devotees.`,
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
          }
        ];

        const uTx = this.db.transaction(['updates'], 'readwrite');
        const uStore = uTx.objectStore('updates');
        seedUpdates.forEach(u => uStore.put(u));

        const seedWishes = [
          {
            id: 'wish_seed_1',
            name: 'Debojyoti & Family',
            location: 'Kolkata, WB',
            message: 'Shubho Kojagari Lokkhi Puja to everyone! May Maa Lakshmi fill all our homes with endless peace, health, and prosperity. 🪔🙏',
            timestamp: new Date(Date.now() - 3600000 * 15).toISOString()
          },
          {
            id: 'wish_seed_2',
            name: 'Sunita Chakraborty',
            location: 'Bengaluru',
            message: 'Watching the mandap and darshan from afar. Beautiful idol and mesmerizing alpona! জয় মা লক্ষ্মী! 🙏✨',
            timestamp: new Date(Date.now() - 3600000 * 9).toISOString()
          },
          {
            id: 'wish_seed_3',
            name: 'Arup Roy',
            location: 'Howrah',
            message: 'Heartiest festive wishes to the entire puja committee and all neighborhood families. May Maa bless our children with wisdom and happiness.',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
          }
        ];

        const wTx = this.db.transaction(['wishes'], 'readwrite');
        const wStore = wTx.objectStore('wishes');
        seedWishes.forEach(w => wStore.put(w));

        const mTx = this.db.transaction(['meta'], 'readwrite');
        mTx.objectStore('meta').put({ key: 'diyas_lit', value: 142 });
      }
    };
  }

  // --- DEITY PHOTO (Virtual Darshan Cloud & Local Sync) ---
  async getDeityPhoto() {
    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        const cloudPhoto = await window.firebaseService.getDeityPhoto();
        if (cloudPhoto) return cloudPhoto;
      } catch (e) {
        console.warn('Could not fetch cloud deity photo:', e);
      }
    }
    return localStorage.getItem('puja_deity_photo') || null;
  }

  async saveDeityPhoto(imageUrl) {
    localStorage.setItem('puja_deity_photo', imageUrl);
    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        await window.firebaseService.saveDeityPhoto(imageUrl);
      } catch (e) {
        console.warn('Could not sync deity photo to cloud:', e);
      }
    }
    return true;
  }

  async resetDeityPhoto() {
    localStorage.removeItem('puja_deity_photo');
    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        await window.firebaseService.resetDeityPhoto();
      } catch (e) {
        console.warn('Could not reset cloud deity photo:', e);
      }
    }
    return true;
  }

  // --- COMMITTEE MEMBERS (Local Storage & Firebase Cloud Sync) ---
  getCommitteeStorage() {
    // Purge any legacy dummy seed members (member_1 to member_10) from old storage
    try {
      const stored = localStorage.getItem('amfan_committee_members');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // If all members are legacy dummy seeds, purge them
          const hasDummy = parsed.some(m => m.id === 'member_1' && m.name === 'শ্রী অমল জানা');
          if (hasDummy) {
            localStorage.removeItem('amfan_committee_members');
            return [];
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error reading committee from localStorage:', e);
    }
    // Pure clean empty state - no fake or random members!
    return [];
  }

  async getCommitteeMembers() {
    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        const cloudMembers = await window.firebaseService.getCommitteeMembers();
        if (Array.isArray(cloudMembers)) {
          try {
            localStorage.setItem('amfan_committee_members', JSON.stringify(cloudMembers));
          } catch (e) {}
          return cloudMembers;
        }
      } catch (e) {
        console.warn('Could not fetch cloud committee members:', e);
      }
    }
    return this.getCommitteeStorage();
  }

  async saveCommitteeMember(member) {
    const list = this.getCommitteeStorage();
    const id = member.id || 'member_' + Date.now();
    const updatedMember = {
      ...member,
      id,
      timestamp: member.timestamp || new Date().toISOString()
    };

    const existingIdx = list.findIndex(m => m.id === id);
    if (existingIdx >= 0) {
      list[existingIdx] = updatedMember;
    } else {
      list.push(updatedMember);
    }

    try {
      localStorage.setItem('amfan_committee_members', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save committee error:', e);
    }

    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        await window.firebaseService.saveCommitteeMember(updatedMember);
      } catch (e) {
        console.warn('Could not sync committee member to cloud:', e);
      }
    }

    return updatedMember;
  }

  async deleteCommitteeMember(id) {
    const list = this.getCommitteeStorage();
    const filtered = list.filter(m => m.id !== id);
    try {
      localStorage.setItem('amfan_committee_members', JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage delete committee error:', e);
    }

    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        await window.firebaseService.deleteCommitteeMember(id);
      } catch (e) {
        console.warn('Could not sync committee delete to cloud:', e);
      }
    }

    return true;
  }

  // ==========================================================
  // PAYMENT CONFIGURATION & UPI SETTINGS
  // ==========================================================
  getPaymentConfigLocal() {
    const defaultConfig = {
      primaryUpiId: 'sudiptamaity670@ybl',
      secondaryUpiId: '7407352005@axl',
      payeeName: 'Amfan NSCC Kojagari Laxmi Puja',
      customQrUrl: '',
      presetAmounts: [51, 101, 251, 501, 1001, 2101, 5001]
    };
    try {
      const stored = localStorage.getItem('amfan_payment_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.primaryUpiId === '7407352005@ybl' || parsed.primaryUpiId === '7407352005@upi' || String(parsed.primaryUpiId).includes('%40')) {
          parsed.primaryUpiId = 'sudiptamaity670@ybl';
        }
        if (String(parsed.secondaryUpiId).includes('%40')) {
          parsed.secondaryUpiId = '7407352005@axl';
        }
        try {
          localStorage.setItem('amfan_payment_config', JSON.stringify(parsed));
        } catch (e) {}
        return { ...defaultConfig, ...parsed };
      }
    } catch (e) {
      console.warn('LocalStorage payment config read error:', e);
    }
    return defaultConfig;
  }

  async getPaymentConfig() {
    if (this.isCloudActive()) {
      try {
        const cloudConfig = await window.firebaseService.getPaymentConfig();
        if (cloudConfig && cloudConfig.primaryUpiId) {
          try {
            localStorage.setItem('amfan_payment_config', JSON.stringify(cloudConfig));
          } catch (e) {}
          return { ...this.getPaymentConfigLocal(), ...cloudConfig };
        }
      } catch (e) {
        console.warn('Could not fetch cloud payment config:', e);
      }
    }
    return this.getPaymentConfigLocal();
  }

  async savePaymentConfig(config) {
    const current = this.getPaymentConfigLocal();
    const updated = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem('amfan_payment_config', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save payment config error:', e);
    }

    if (this.isCloudActive()) {
      try {
        await window.firebaseService.savePaymentConfig(updated);
      } catch (e) {
        console.warn('Could not sync payment config to cloud:', e);
      }
    }
    return updated;
  }

  // ==========================================================
  // DONATIONS & PRONAMI MANAGEMENT
  // ==========================================================
  getInitialSampleDonations() {
    return [];
  }

  getDonationsStorage() {
    try {
      const stored = localStorage.getItem('amfan_puja_donations');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Clean out old seeded sample records with personal names or sample IDs
          const cleaned = parsed.filter(d => d && !String(d.id || '').startsWith('don_init_') && (!d.donorName || !d.donorName.includes('সুদীপ্ত')));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('amfan_puja_donations', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('LocalStorage donations read error:', e);
    }
    return [];
  }

  async getAllDonations() {
    if (this.isCloudActive()) {
      try {
        const cloudDonations = await window.firebaseService.getDonations();
        if (cloudDonations && cloudDonations.length > 0) {
          // Filter out any legacy sample data from cloud
          const cleanCloud = cloudDonations.filter(d => d && !String(d.id || '').startsWith('don_init_') && (!d.donorName || !d.donorName.includes('সুদীপ্ত')));
          try {
            localStorage.setItem('amfan_puja_donations', JSON.stringify(cleanCloud));
          } catch (e) {}
          return cleanCloud;
        }
      } catch (e) {
        console.warn('Could not fetch cloud donations:', e);
      }
    }
    return this.getDonationsStorage();
  }

  async saveDonation(donation) {
    const list = this.getDonationsStorage();
    const id = donation.id || 'don_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const receiptNo = donation.receiptNo || ('AMF-LK-2026-' + Math.floor(1000 + Math.random() * 9000));
    const newDonation = {
      ...donation,
      id,
      receiptNo,
      amount: Number(donation.amount) || 0,
      status: donation.status || 'pending',
      timestamp: donation.timestamp || new Date().toISOString()
    };

    const existingIdx = list.findIndex(d => d.id === id || (d.receiptNo && d.receiptNo === receiptNo));
    if (existingIdx >= 0) {
      list[existingIdx] = newDonation;
    } else {
      list.unshift(newDonation);
    }

    try {
      localStorage.setItem('amfan_puja_donations', JSON.stringify(list));
    } catch (e) {
      console.warn('LocalStorage save donation error:', e);
    }

    if (this.isCloudActive()) {
      try {
        await window.firebaseService.saveDonation(newDonation);
      } catch (e) {
        console.warn('Could not sync donation to cloud:', e);
      }
    }

    return newDonation;
  }

  async deleteDonation(id) {
    const list = this.getDonationsStorage();
    const filtered = list.filter(d => d.id !== id);
    try {
      localStorage.setItem('amfan_puja_donations', JSON.stringify(filtered));
    } catch (e) {
      console.warn('LocalStorage delete donation error:', e);
    }

    if (this.isCloudActive()) {
      try {
        await window.firebaseService.deleteDonation(id);
      } catch (e) {
        console.warn('Could not sync delete donation to cloud:', e);
      }
    }

    return true;
  }

  async updateDonationStatus(id, status) {
    const list = this.getDonationsStorage();
    const item = list.find(d => d.id === id);
    if (item) {
      item.status = status;
      try {
        localStorage.setItem('amfan_puja_donations', JSON.stringify(list));
      } catch (e) {}
    }
    if (this.isCloudActive()) {
      try {
        await window.firebaseService.updateDonationStatus(id, status);
      } catch (e) {}
    }
    return item;
  }

  // ==========================================================
  // ADMIN AUTH & RECOVERY SETTINGS
  // ==========================================================
  cleanSecurityQuestion(question) {
    const defaultQ = 'আমফান ক্লাবের গোপন সিকিউরিটি পাসফ্রেস কী?';
    if (!question || typeof question !== 'string') return defaultQ;
    const q = question.trim();
    if (q.includes('à¦') || q.includes('\u008d') || q.includes('') || q.includes('?_') || q.includes('+r') || q.length < 5) {
      return defaultQ;
    }
    return q;
  }

  getAdminAuthLocal() {
    const defaultPin = '24689011';
    const defaultQuestion = 'আমফান ক্লাবের গোপন সিকিউরিটি পাসফ্রেস কী?';
    const defaultAnswer = 'I AM A GOOD BOY';

    const pin = localStorage.getItem('puja_admin_pin') || defaultPin;
    const question = this.cleanSecurityQuestion(localStorage.getItem('puja_security_question'));
    localStorage.setItem('puja_security_question', question);

    let answer = localStorage.getItem('puja_security_answer');
    if (!answer || answer.trim().toUpperCase() === 'NSCC') {
      answer = defaultAnswer;
      localStorage.setItem('puja_security_answer', defaultAnswer);
    }

    return { pin, securityQuestion: question, securityAnswer: answer };
  }

  async getAdminAuth() {
    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        const cloudAuth = await window.firebaseService.getAdminAuth();
        if (cloudAuth && cloudAuth.pin) {
          const localUpdated = localStorage.getItem('puja_admin_pin_updated') || '';
          const cloudUpdated = cloudAuth.updatedAt || '';
          // Only sync from cloud if local has no pin or cloud is strictly newer
          if (!localStorage.getItem('puja_admin_pin') || !localUpdated || (cloudUpdated && cloudUpdated >= localUpdated)) {
            localStorage.setItem('puja_admin_pin', cloudAuth.pin);
            const cleanQ = this.cleanSecurityQuestion(cloudAuth.securityQuestion);
            localStorage.setItem('puja_security_question', cleanQ);
            if (cloudAuth.securityAnswer) localStorage.setItem('puja_security_answer', cloudAuth.securityAnswer);
            if (cloudUpdated) localStorage.setItem('puja_admin_pin_updated', cloudUpdated);
          }
        }
      } catch (e) {
        console.warn('Could not fetch cloud admin auth:', e);
      }
    }
    return this.getAdminAuthLocal();
  }

  async saveAdminAuth({ pin, securityQuestion, securityAnswer }) {
    const now = new Date().toISOString();
    if (pin) {
      const cleanPin = String(pin).trim();
      localStorage.setItem('puja_admin_pin', cleanPin);
      localStorage.setItem('puja_admin_pin_updated', now);
    }
    if (securityQuestion) localStorage.setItem('puja_security_question', String(securityQuestion).trim());
    if (securityAnswer) localStorage.setItem('puja_security_answer', String(securityAnswer).trim());

    if (window.firebaseService && window.firebaseService.isReady) {
      try {
        await window.firebaseService.saveAdminAuth({ pin, securityQuestion, securityAnswer });
      } catch (e) {
        console.warn('Could not sync admin auth to cloud:', e);
      }
    }
    return this.getAdminAuthLocal();
  }

  verifySecurityAnswer(inputAnswer) {
    if (!inputAnswer) return false;
    // Strip surrounding quotes if typed with quotes e.g. "I AM A GOOD BOY"
    let cleanInput = String(inputAnswer).trim();
    if ((cleanInput.startsWith('"') && cleanInput.endsWith('"')) || (cleanInput.startsWith("'") && cleanInput.endsWith("'"))) {
      cleanInput = cleanInput.slice(1, -1).trim();
    }
    cleanInput = cleanInput.toLowerCase().replace(/\s+/g, ' ');

    const auth = this.getAdminAuthLocal();
    let storedAnswer = (auth.securityAnswer || 'I AM A GOOD BOY').trim();
    if ((storedAnswer.startsWith('"') && storedAnswer.endsWith('"')) || (storedAnswer.startsWith("'") && storedAnswer.endsWith("'"))) {
      storedAnswer = storedAnswer.slice(1, -1).trim();
    }
    storedAnswer = storedAnswer.toLowerCase().replace(/\s+/g, ' ');

    // 1. Direct match with configured answer (e.g. "i am a good boy")
    if (cleanInput === storedAnswer) return true;

    // 2. Space-insensitive match (e.g. "iamagoodboy" or extra spaces)
    if (cleanInput.replace(/\s+/g, '') === storedAnswer.replace(/\s+/g, '')) return true;

    // 3. Accepted variations for "I AM A GOOD BOY"
    const validVariants = [
      'i am a good boy',
      'i am a goodboy',
      'iam a good boy',
      'i am good boy',
      'iamagoodboy'
    ];
    return validVariants.includes(cleanInput) || validVariants.includes(cleanInput.replace(/\s+/g, ''));
  }
}

// Global instance
window.pujaDB = new PujaDB();
