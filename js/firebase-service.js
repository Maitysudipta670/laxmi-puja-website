/**
 * Google Firebase Service for Laxmi Puja Web Portal
 * Handles Cloud Firestore & Firebase Storage integration for real-time public syncing.
 */

class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.storage = null;
    this.isReady = false;
    this.config = null;
    this.listeners = [];
  }

  /**
   * Parse and retrieve current active Firebase configuration
   */
  getActiveConfig() {
    // Check localStorage first (configured via UI modal)
    try {
      const stored = localStorage.getItem('puja_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored Firebase config:', e);
    }

    // Check window.FIREBASE_CONFIG from firebase-config.js
    if (window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.projectId && window.FIREBASE_CONFIG.apiKey) {
      return window.FIREBASE_CONFIG;
    }

    return null;
  }

  /**
   * Initialize Firebase SDK
   */
  async init() {
    this.config = this.getActiveConfig();

    if (!this.config) {
      console.log('Firebase: No configuration found. Running in Local Mode (IndexedDB).');
      this.isReady = false;
      return false;
    }

    // Verify Firebase SDK loaded
    if (typeof firebase === 'undefined') {
      console.warn('Firebase SDK not loaded from CDN.');
      this.isReady = false;
      return false;
    }

    try {
      // Check if default app already initialized
      if (!firebase.apps.length) {
        this.app = firebase.initializeApp(this.config);
      } else {
        this.app = firebase.app();
      }

      this.db = firebase.firestore();

      // Enable offline persistence if available
      try {
        await this.db.enablePersistence({ synchronizeTabs: true });
      } catch (err) {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
          console.warn('Firestore persistence warning:', err);
        }
      }

      if (firebase.storage) {
        try {
          this.storage = firebase.storage();
        } catch (e) {
          console.warn('Firebase storage init warning:', e);
        }
      }

      this.isReady = true;
      console.log('🟢 Firebase Connected successfully to project:', this.config.projectId);
      return true;
    } catch (err) {
      console.error('Firebase initialization error:', err);
      this.isReady = false;
      return false;
    }
  }

  /**
   * Test Connection by doing a ping write/read
   */
  async testConnection(configToTest = null) {
    const config = configToTest || this.config;
    if (!config || !config.apiKey || !config.projectId) {
      throw new Error('Incomplete Firebase configuration. Please provide at least apiKey and projectId.');
    }

    let testApp;
    const testAppName = 'testApp_' + Date.now();
    try {
      testApp = firebase.initializeApp(config, testAppName);
      const testDb = testApp.firestore();
      const testRef = testDb.collection('puja_system_health').doc('connection_test');
      
      await testRef.set({
        status: 'connected',
        testedAt: new Date().toISOString(),
        client: 'localhost-web-client'
      });

      const snap = await testRef.get();
      if (!snap.exists) {
        throw new Error('Could not read written test document from Firestore.');
      }

      // Cleanup
      await testApp.delete();
      return { success: true, projectId: config.projectId };
    } catch (err) {
      if (testApp) {
        try { await testApp.delete(); } catch(e) {}
      }
      throw err;
    }
  }

  // ==========================================================
  // REAL-TIME FIRESTORE REPOSITORIES
  // ==========================================================

  // --- PHOTOS ---
  async getPhotos() {
    if (!this.isReady) return [];
    try {
      const snap = await this.db.collection('puja_photos').orderBy('timestamp', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Firebase getPhotos error:', err);
      throw err;
    }
  }

  async savePhoto(photo) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const photoId = photo.id || 'photo_' + Date.now();
    const docData = {
      title: photo.title || 'Untitled',
      category: photo.category || 'General',
      photographer: photo.photographer || 'Devotee',
      caption: photo.caption || '',
      imageUrl: photo.imageUrl,
      likes: photo.likes || 0,
      timestamp: photo.timestamp || new Date().toISOString()
    };

    await this.db.collection('puja_photos').doc(photoId).set(docData, { merge: true });
    return { id: photoId, ...docData };
  }

  async deletePhoto(photoId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('puja_photos').doc(photoId).delete();
    return true;
  }

  async likePhoto(photoId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const ref = this.db.collection('puja_photos').doc(photoId);
    await ref.update({
      likes: firebase.firestore.FieldValue.increment(1)
    });
    const updated = await ref.get();
    return updated.data() ? updated.data().likes : 1;
  }

  onPhotosChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_photos')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const photos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(photos);
      }, (error) => {
        console.warn('Photos listener error:', error);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- UPDATES ("diffarent types of update") ---
  async getUpdates() {
    if (!this.isReady) return [];
    try {
      const snap = await this.db.collection('puja_updates').get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.timestamp) - new Date(a.timestamp);
      });
      return list;
    } catch (err) {
      console.error('Firebase getUpdates error:', err);
      throw err;
    }
  }

  async saveUpdate(update) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const updateId = update.id || 'update_' + Date.now();
    const docData = {
      title: update.title,
      category: update.category,
      priority: update.priority || 'normal',
      isPinned: !!update.isPinned,
      author: update.author || 'Puja Committee',
      body: update.body,
      likes: typeof update.likes === 'number' ? update.likes : 0,
      timestamp: update.timestamp || new Date().toISOString()
    };

    await this.db.collection('puja_updates').doc(updateId).set(docData, { merge: true });
    return { id: updateId, ...docData };
  }

  async deleteUpdate(updateId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('puja_updates').doc(updateId).delete();
    return true;
  }

  async likeUpdate(updateId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const ref = this.db.collection('puja_updates').doc(updateId);
    await ref.update({
      likes: firebase.firestore.FieldValue.increment(1)
    });
    const updated = await ref.get();
    return updated.data() ? (updated.data().likes || 1) : 1;
  }

  onUpdatesChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_updates')
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.timestamp) - new Date(a.timestamp);
        });
        callback(list);
      }, (err) => {
        console.warn('Updates listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- WISHES ---
  async getWishes() {
    if (!this.isReady) return [];
    try {
      const snap = await this.db.collection('puja_wishes').orderBy('timestamp', 'desc').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Firebase getWishes error:', err);
      throw err;
    }
  }

  async saveWish(wish) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const wishId = wish.id || 'wish_' + Date.now();
    const docData = {
      name: wish.name,
      location: wish.location || '',
      message: wish.message,
      timestamp: wish.timestamp || new Date().toISOString()
    };
    await this.db.collection('puja_wishes').doc(wishId).set(docData);
    return { id: wishId, ...docData };
  }

  async deleteWish(wishId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('puja_wishes').doc(wishId).delete();
    return true;
  }

  onWishesChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_wishes')
      .orderBy('timestamp', 'desc')
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(list);
      }, (err) => {
        console.warn('Wishes listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- COUNTERS (Diyas Lit) ---
  async getCounter(key, defaultValue = 0) {
    if (!this.isReady) return defaultValue;
    try {
      const doc = await this.db.collection('puja_counters').doc(key).get();
      return doc.exists ? (doc.data().value || defaultValue) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  async incrementCounter(key) {
    if (!this.isReady) return 1;
    const ref = this.db.collection('puja_counters').doc(key);
    await ref.set({
      value: firebase.firestore.FieldValue.increment(1)
    }, { merge: true });
    const snap = await ref.get();
    return snap.data().value;
  }

  onCounterChanged(key, callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_counters').doc(key)
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data().value);
        }
      }, () => {});
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- DEITY PHOTO (Virtual Darshan Cloud Sync) ---
  async getDeityPhoto() {
    if (!this.isReady) return null;
    try {
      const doc = await this.db.collection('puja_settings').doc('altar').get();
      return doc.exists ? doc.data().deityImageUrl : null;
    } catch (e) {
      console.warn('Firebase getDeityPhoto error:', e);
      return null;
    }
  }

  async saveDeityPhoto(imageUrl) {
    if (!this.isReady) return false;
    try {
      await this.db.collection('puja_settings').doc('altar').set({
        deityImageUrl: imageUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (e) {
      console.error('Firebase saveDeityPhoto error:', e);
      return false;
    }
  }

  async resetDeityPhoto() {
    if (!this.isReady) return false;
    try {
      await this.db.collection('puja_settings').doc('altar').delete();
      return true;
    } catch (e) {
      return false;
    }
  }

  onDeityPhotoChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_settings').doc('altar')
      .onSnapshot((doc) => {
        if (doc.exists && doc.data().deityImageUrl) {
          callback(doc.data().deityImageUrl);
        } else {
          callback(null);
        }
      }, (err) => {
        console.warn('Deity photo listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- ADMIN AUTH & SECURITY SETTINGS CLOUD SYNC ---
  async getAdminAuth() {
    if (!this.isReady) return null;
    try {
      const doc = await this.db.collection('puja_settings').doc('admin_auth').get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.warn('Firebase getAdminAuth error:', e);
      return null;
    }
  }

  async saveAdminAuth({ pin, securityQuestion, securityAnswer }) {
    if (!this.isReady) return false;
    try {
      const payload = {
        updatedAt: new Date().toISOString()
      };
      if (pin) payload.pin = String(pin).trim();
      if (securityQuestion) payload.securityQuestion = String(securityQuestion).trim();
      if (securityAnswer) payload.securityAnswer = String(securityAnswer).trim();

      await this.db.collection('puja_settings').doc('admin_auth').set(payload, { merge: true });
      return true;
    } catch (e) {
      console.error('Firebase saveAdminAuth error:', e);
      return false;
    }
  }

  onAdminAuthChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_settings').doc('admin_auth')
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data());
        }
      }, (err) => {
        console.warn('Admin auth listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // ==========================================================
  // SYNC LOCAL DATA TO CLOUD FIRESTORE
  // ==========================================================
  async syncLocalDataToCloud(localPhotos, localUpdates, localWishes) {
    if (!this.isReady) throw new Error('Firebase is not connected');

    let pCount = 0;
    let uCount = 0;
    let wCount = 0;

    // Batch photos
    for (const photo of localPhotos) {
      await this.savePhoto(photo);
      pCount++;
    }

    // Batch updates
    for (const update of localUpdates) {
      await this.saveUpdate(update);
      uCount++;
    }

    // Batch wishes
    for (const wish of localWishes) {
      await this.saveWish(wish);
      wCount++;
    }

    return { pCount, uCount, wCount };
  }

  // --- COMMITTEE MEMBERS (Cloud Firestore) ---
  async getCommitteeMembers() {
    if (!this.isReady) return [];
    try {
      const snap = await this.db.collection('committee_members').get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      return list;
    } catch (err) {
      console.error('Firebase getCommitteeMembers error:', err);
      return [];
    }
  }

  async saveCommitteeMember(member) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const memberId = member.id || 'member_' + Date.now();
    const docData = {
      name: member.name,
      role: member.role,
      category: member.category || 'member',
      phone: member.phone || '',
      photo: member.photo || '',
      timestamp: member.timestamp || new Date().toISOString()
    };
    await this.db.collection('committee_members').doc(memberId).set(docData, { merge: true });
    return { id: memberId, ...docData };
  }

  async deleteCommitteeMember(memberId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('committee_members').doc(memberId).delete();
    return true;
  }

  onCommitteeMembersChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('committee_members')
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        callback(list);
      }, (err) => {
        console.warn('Committee members listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- DONATIONS & PRONAMI (Cloud Firestore) ---
  async getDonations() {
    if (!this.isReady) return [];
    try {
      const snap = await this.db.collection('puja_donations').get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      return list;
    } catch (err) {
      console.error('Firebase getDonations error:', err);
      return [];
    }
  }

  async saveDonation(donation) {
    if (!this.isReady) throw new Error('Firebase not connected');
    const donId = donation.id || 'don_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const docData = {
      donorName: donation.donorName || '',
      gotra: donation.gotra || '',
      phone: donation.phone || '',
      village: donation.village || '',
      amount: Number(donation.amount) || 0,
      paymentMethod: donation.paymentMethod || 'UPI',
      upiIdUsed: donation.upiIdUsed || '',
      utrNumber: donation.utrNumber || '',
      receiptNo: donation.receiptNo || ('AMF-LK-2026-' + Math.floor(1000 + Math.random() * 9000)),
      prayer: donation.prayer || '',
      status: donation.status || 'verified',
      timestamp: donation.timestamp || new Date().toISOString()
    };
    await this.db.collection('puja_donations').doc(donId).set(docData, { merge: true });
    return { id: donId, ...docData };
  }

  async deleteDonation(donId) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('puja_donations').doc(donId).delete();
    return true;
  }

  async updateDonationStatus(donId, status) {
    if (!this.isReady) throw new Error('Firebase not connected');
    await this.db.collection('puja_donations').doc(donId).update({
      status: status,
      verifiedAt: new Date().toISOString()
    });
    return true;
  }

  onDonationsChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_donations')
      .onSnapshot((snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        callback(list);
      }, (err) => {
        console.warn('Donations listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  // --- PAYMENT CONFIGURATION (Cloud Firestore) ---
  async getPaymentConfig() {
    if (!this.isReady) return null;
    try {
      const doc = await this.db.collection('puja_settings').doc('payment_config').get();
      return doc.exists ? doc.data() : null;
    } catch (e) {
      console.warn('Firebase getPaymentConfig error:', e);
      return null;
    }
  }

  async savePaymentConfig(config) {
    if (!this.isReady) return false;
    try {
      const payload = {
        primaryUpiId: config.primaryUpiId || 'sudiptamaity670@ybl',
        secondaryUpiId: config.secondaryUpiId || '7407352005@axl',
        payeeName: config.payeeName || 'Amfan NSCC Kojagari Laxmi Puja',
        customQrUrl: config.customQrUrl || '',
        updatedAt: new Date().toISOString()
      };
      await this.db.collection('puja_settings').doc('payment_config').set(payload, { merge: true });
      return true;
    } catch (e) {
      console.error('Firebase savePaymentConfig error:', e);
      return false;
    }
  }

  onPaymentConfigChanged(callback) {
    if (!this.isReady) return null;
    const unsubscribe = this.db.collection('puja_settings').doc('payment_config')
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback(doc.data());
        }
      }, (err) => {
        console.warn('Payment config listener error:', err);
      });
    this.listeners.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Save Firebase Configuration and reload
   */
  saveConfig(config) {
    localStorage.setItem('puja_firebase_config', JSON.stringify(config));
  }

  clearConfig() {
    localStorage.removeItem('puja_firebase_config');
  }
}

// Global instance
window.firebaseService = new FirebaseService();
