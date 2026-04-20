/* eslint-disable */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

/* ================= FIREBASE INIT ================= */
firebase.initializeApp({
  apiKey: "AIzaSyBB_fGNjfj2w8Y4lgG2nGw0vxrevVcaVb0",
  authDomain: "lrcsheetmobile.firebaseapp.com",
  databaseURL: "https://lrcsheetmobile-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lrcsheetmobile",
  storageBucket: "lrcsheetmobile.firebasestorage.app",
  messagingSenderId: "239069891450",
  appId: "1:239069891450:web:533039010fc1189bb824c3",
  measurementId: "G-PNS4WDS2XK"
});

const messaging = firebase.messaging();

/* ================= INDEXED DB CONFIG ================= */
const DB_NAME = "NotificationDB";
const DB_VERSION = 2;
const STORE_NAME = "notifications";

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveNotificationToDB(notification) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.add(notification);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.error("❌ saveNotificationToDB failed:", err);
  }
}

/* ================= BACKGROUND MESSAGE ================= */
messaging.onBackgroundMessage(async (payload) => {
  console.log("Payload reçu en background:", payload);

  const title = payload?.data?.title || "Nouvelle notification";
  const body = payload?.data?.body || "";

  const notificationData = {
    path: payload?.data?.path || "/",
    adminSectionIndex: payload?.data?.adminSectionIndex || "0",
    adminPageIndex: payload?.data?.adminPageIndex || "0",
    senderId: payload?.data?.senderId
  };

  //Sauvegarde locale
  await saveNotificationToDB(notificationData);

  //Affichage de la notification navigateur
  await self.registration.showNotification(title, {
    body: body,
    icon: "/images/logo/logo.png",
    data: notificationData,
    requireInteraction: true, // reste affichée jusqu'à interaction
    actions: [
      { action: "close", title: "Fermer" } // bouton Fermer
    ]
  });
});

/* ================= CLICK HANDLER ================= */
self.addEventListener("notificationclick", (event) => {
  if (event.action === "close") {
    // Bouton Fermer cliqué
    event.notification.close();
    return;
  }

  // Clic sur la notification elle-même
  event.notification.close();
  const path = event.notification?.data?.path || "/";
  event.waitUntil(clients.openWindow(path));
});
