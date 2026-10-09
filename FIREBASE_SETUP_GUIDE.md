# 🔥 Step-by-Step Guide: Connecting Google Firebase Console to Localhost

This guide explains how to connect your **Laxmi Puja Website** (running on `localhost` or via `start.bat`) to **Google Firebase Console** for free real-time cloud syncing of public photos, updates, and wishes.

---

## 🌟 What Connecting Firebase Gives You
* **Universal Real-time Sync**: Any photo uploaded or announcement posted from localhost or mobile is instantly visible to everyone without refreshing.
* **Likes & Diya Counter Sync**: Devotees lighting diyas or liking photos update live across all devices.
* **Persistent Cloud Storage**: Photos and notices are safely stored in Google Cloud Firestore.

---

## 🚀 Step 1: Create a Free Project in Firebase Console

1. Open your browser and go to the [Google Firebase Console](https://console.firebase.google.com/).
2. Sign in with your Google account.
3. Click **"Add project"** (or **"Create a project"**).
4. Enter a project name, for example: `laxmi-puja-2026`.
5. *(Optional)* You can disable Google Analytics to keep setup simple, then click **"Create project"**.
6. Wait a few seconds for Firebase to finish creating the project, then click **"Continue"**.

---

## 🌐 Step 2: Register a Web App & Copy Configuration

1. On your Firebase Project Overview dashboard, look for the **"Get started by adding Firebase to your app"** section.
2. Click the **Web** icon (represented as **`</>`**).
3. App nickname: Enter `Laxmi Puja Web` (you do not need to check Firebase Hosting for now).
4. Click **"Register app"**.
5. You will see a code block containing `const firebaseConfig = { ... };`.
   It looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxx",
     authDomain: "laxmi-puja-2026.firebaseapp.com",
     projectId: "laxmi-puja-2026",
     storageBucket: "laxmi-puja-2026.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```
6. **Copy this entire code snippet** (or keep the browser tab open).

---

## 🗄️ Step 3: Enable Cloud Firestore Database

1. In the left-hand navigation sidebar of the Firebase Console, go to:
   **Build** &rarr; **Firestore Database**.
2. Click **"Create database"**.
3. **Database location**: Choose the default (e.g. `nam5 (us-central)` or `asia-south1 (Mumbai)` for India). Click **Next**.
4. **Security rules**:
   - Select **"Start in test mode"** (this allows read and write operations immediately for your localhost test).
   - Click **"Enable"**.

> [!NOTE]
> If you want permanent public read & write access for your community puja festival, go to the **Rules** tab in Firestore Database and ensure your rules look like this:
> ```javascript
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```
> Click **"Publish"** to save.

---

## ⚡ Step 4: Connect to Your Website (Choose Either Method)

### Method A: Connect from the Website UI (Recommended - No Code Editing!)
1. Open your website in your browser (double-click `start.bat` or open `index.html`).
2. In the top hero section, click the pill button:
   **🟡 Local Mode (Click to Connect Firebase)**
   *(Or go to the "Backup & Data" tab and click "Configure Firebase Connection")*.
3. In the modal that appears, **paste your copied Firebase snippet** into the **"Quick Paste"** box.
4. Click **"✨ Auto-Extract Fields from Snippet"**. The form fields will automatically fill in!
5. Click **"🧪 Test Connection from Localhost"**. You will see:
   `✅ Success! Connected to Firestore project ...`
6. Click **"💾 Save & Connect Cloud Server"**.
7. The status in the header will turn green:
   **🟢 Firebase Cloud: laxmi-puja-2026**!
8. *(Optional)* Click **"☁️ Upload Local Demo Data to Firebase"** in the Backup tab to populate your new Firebase cloud database with initial sample photos and schedules!

---

### Method B: Edit `js/firebase-config.js` directly
If you prefer saving your config directly in the project files:
1. Open `js/firebase-config.js` in your editor.
2. Replace the empty values with your keys:
   ```javascript
   window.FIREBASE_CONFIG = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
3. Refresh `index.html` in your browser. The website will immediately connect to Firebase!

---

## 🔒 Verification & Troubleshooting

### Q: Does this work on `localhost` and `file://`?
**Yes!** Google Firebase Cloud Firestore supports connections from `http://localhost`, `http://127.0.0.1`, and deployed web domains without needing local server configurations.

### Q: What if I am offline?
If internet connection is lost or Firebase is not configured, the website automatically falls back to the browser's **IndexedDB**, so you can still add photos and view content seamlessly.
