# 🪔 শ্রী শ্রী কোজাগরী লক্ষ্মী পূজা (Shree Shree Kojagari Laxmi Puja Web Portal)

A divine, festive, and responsive web application designed for **Laxmi Puja (Kojagari Lokkhi Pujo)** celebrations. It allows organizers and devotees to easily save and view photos publicly, publish different types of live announcements, and participate in virtual darshan.

---

## ✨ Features Overview

### 1. 📸 Public Photo Gallery & Easy Photo Saver
* **Save Photos Easily**: Devotees and organizers can click **"Upload Photo"** or drag & drop images directly from phones or computers.
* **Automatic Client-Side Optimization**: Automatically resizes and optimizes photos via HTML5 Canvas before saving into browser `IndexedDB`, ensuring fast loading and huge storage capacity without size limits.
* **Public Viewing Lightbox**: Full-resolution viewing with zoom, photo metadata (Photographer, Category, Timestamp, Story/Caption), Like counter, and direct Download button.
* **Categorized Filtering**:
  - প্রতিমা (Maa Lakshmi Idol / Pratima)
  - মণ্ডপ (Mandap & Pandal Decoration)
  - আলপনা (Traditional Rice-Paste Alpona Designs & Lokkhir Paa)
  - ভোগ ও প্রসাদ (Mahabhog, Naru, Moa & Prasad Offerings)
  - আরতি ও ধুনুচি (Sandhya Aarti & Dhunuchi Naach)
  - পরিবার ও ভক্তবৃন্দ (Family & Devotees)
* **Real-time Search**: Search by title, photographer, or keyword.
* **Social Sharing**: One-click sharing with Web Share API and link copying.

---

### 2. 📢 Live Puja Updates Notice Board ("Different Types of Updates")
Post and view organized bulletins across distinct categories with color-coded badges and priority indicators:
* 🕒 **Puja Schedule & Tithi Timings**: Kojagari Purnima timings, Nishita Muhurat, Sandhya Aarti time, Pushpanjali batches.
* 🍲 **Bhog & Prasad Details**: Daily bhog items (Khichuri, Labra, Chhanar Payesh, Naru), distribution timings, coupon notices.
* 🔴 **Urgent Announcements**: Immediate instructions, weather advisories, photography rules, crowd control.
* 🎭 **Cultural & Competitions**: Alpona competition results, Dhunuchi dance, musical soiree ("Ke Jagore" vigil).
* 📢 **General Notices**: Committee information, donation receipts, and volunteer schedules.
* 📌 **Pin to Top**: Important notices can be pinned to stay at the very top.

---

### 3. 🪔 Virtual Mandap & Devotional Interactivity
* **Interactive Diya Lighting**: Click to light an earthen deepam with flickering flame animation and a persistent counter tracking total diyas lit.
* **Pushpanjali Flower Shower**: Click to shower animated red lotus and yellow marigold petals over Maa Lakshmi's sanctum.
* **Web Audio API Temple Soundscape** (Zero external audio file dependencies):
  - 🐚 **Shankha Dhwani**: Realistic sacred conch shell blow.
  - 🔔 **Temple Ghanta**: Clear brass bell chime with natural reverberation.
  - 🥁 **Bengali Dhaak**: Traditional festive rhythm beat sequence.
  - 🎶 **Temple Drone**: Soothing ambient tanpura/chant drone.

---

### 4. 📜 Authentic Mantras & Panchali
* **Laxmi Pranam Mantra**: Bengali script with English meaning and pronunciation.
* **Pushpanjali Mantra**: Sacred prayer for flower offerings.
* **Dhyan Mantra**: Meditation sloka.
* **Kojagari Brotokatha & Panchali Highlights**: The story and sacred significance of Kojagari night.

---

### 5. 💌 Wishes & Pranam Guestbook Wall
* Community members from near and far can post auspicious greetings and prayers.

---

### 6. 💾 Zero-Backend Database & Portable Backup
* Built on browser **IndexedDB**, allowing offline functioning and permanent storage across browser refreshes.
* **Export Backup**: Download all photos and notices into a single portable `.json` file.
* **Import Backup**: Restore your gallery on any machine with one click.

---

## 🚀 How to Open and Run the Website

### Option 1: Direct Browser Launch (Simplest)
1. Double-click the file `start.bat` inside this directory:
   ```
   C:\Users\maity\.gemini\antigravity\scratch\laxmi-puja-website\start.bat
   ```
2. Or simply double-click `index.html` to open it in Chrome, Edge, Brave, or Firefox.

### Option 2: Run Local Web Server (PowerShell)
If you wish to run a local web server (e.g. at `http://localhost:8080`):
1. Open PowerShell in this folder:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\serve.ps1
   ```
2. The server will start and automatically open your default browser.

---

## 📂 Project Structure
```
laxmi-puja-website/
├── index.html           # Main application structure, tabs & modals
├── start.bat            # One-click Windows launcher
├── serve.ps1            # Lightweight PowerShell HTTP server
├── README.md            # Documentation and instructions
├── css/
│   └── styles.css       # Festive Bengali Alpona theme, animations & layouts
├── js/
│   ├── app.js           # Core UI logic, photo handling & particle shower
│   ├── audio.js         # Web Audio API engine (Shankha, Bell, Dhaak, Drone)
│   └── db.js            # IndexedDB persistent database & seed demo data
└── assets/              # Icons and custom media assets
```

---

## 💡 Setting Active Workspace
To set this project as your active workspace in Antigravity, open folder:
`C:\Users\maity\.gemini\antigravity\scratch\laxmi-puja-website`
