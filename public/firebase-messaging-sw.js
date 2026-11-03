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

/* ================= INDEXED DB ================= */
const DB_NAME = "NotificationDB";
const DB_VERSION = 3; // v3 : force la recréation du store si une ancienne base v2 sans store existe
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
    request.onsuccess = (e) => {
      const db = e.target.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveNotificationToDB(notification) {
  try {
    const db = await openDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add(notification);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    });
  } catch (err) {
    console.error("saveNotificationToDB failed:", err);
  }
}

/* Prévient les pages ouvertes qu'une notif vient d'être enregistrée
 * BroadcastChannel marche même si la page n'est pas contrôlée par ce SW */
async function notifyClients() {
  try {
    const bc = new BroadcastChannel("notif-sync");
    bc.postMessage({ type: "NOTIF_SAVED" });
    bc.close();
  } catch (err) {}
  try {
    const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
    wins.forEach((w) => w.postMessage({ type: "NOTIF_SAVED" }));
  } catch (err) {
    console.error("notifyClients failed:", err);
  }
}

/* Sauvegarde directe sur l'évènement push natif (indépendant de Firebase).
 * Si une fenêtre est visible, c'est onMessage côté page qui s'en charge. */
self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const payload = event.data ? event.data.json() : null;
        console.log("[SW] push reçu", payload);
        const data = payload?.data || {};

        if (data.messagingType === "call" || data.messagingType === "call_cancel") return;

        const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
        if (wins.some((w) => w.visibilityState === "visible")) return;

        await saveNotificationToDB({
          path: data.path || "/",
          adminSectionIndex: data.adminSectionIndex || "",
          adminPageIndex: data.adminPageIndex || "",
          messagingType: data.messagingType || "",
          senderId: data.senderId,
          receiverId: data.receiverId,
        });
        await notifyClients();
      } catch (err) {
        console.error("[SW] push save failed:", err);
      }
    })()
  );
});

/* ================= APPELS ENTRANTS =================
 * Un service worker ne peut pas jouer un son en boucle.
 * On ré-affiche donc la notification toutes les RING_EVERY ms avec
 * `renotify: true` : le navigateur rejoue le SON PAR DÉFAUT du système.
 * La boucle s'arrête : à `call_cancel`, au clic, quand la page prend le relais
 * (message STOP_RINGING) ou après RING_MS.
 */
const RING_MS = 45000;
const RING_EVERY = 4000;
const activeCalls = new Map(); // tag -> { cancelled }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const callTag = (senderId) => `call_${senderId}`;

async function closeByTag(tag) {
  const list = await self.registration.getNotifications({ tag });
  list.forEach((n) => n.close());
}

async function handleCall(data) {
  const tag = callTag(data.senderId);
  const who = data.userFullName || "Appelant";
  const kind = data.callType === "video" ? "vidéo" : "audio";
  const path = data.path || "/";

  // --- L'appelant a raccroché : on remplace la sonnerie par "Appel manqué"
  if (data.messagingType === "call_cancel") {
    const st = activeCalls.get(tag);
    if (st) st.cancelled = true;
    await self.registration.showNotification("Appel manqué", {
      body: who,
      tag,
      icon: "/images/logo.png",
      renotify: false,
      data: { path, senderId: data.senderId, messagingType: "call_missed" },
    });
    return;
  }

  // Déjà en train de sonner pour cet appelant ? on ne double pas la boucle
  if (activeCalls.has(tag)) return;

  const st = { cancelled: false };
  activeCalls.set(tag, st);
  const start = Date.now();

  while (!st.cancelled && Date.now() - start < RING_MS) {
    await self.registration.showNotification(`Appel ${kind} entrant`, {
      body: who,
      tag,
      renotify: true,            // rejoue le son système à chaque affichage
      requireInteraction: true,
      silent: false,
      vibrate: [500, 300, 500, 300, 500],
      icon: "/images/logo.png",
      data: { path, senderId: data.senderId, messagingType: "call", callType: data.callType },
      actions: [
        { action: "accept", title: "Répondre" },
        { action: "decline", title: "Refuser" },
      ],
    });
    await sleep(RING_EVERY);
  }

  const timedOut = !st.cancelled;
  activeCalls.delete(tag);

  if (timedOut) {
    await self.registration.showNotification("Appel manqué", {
      body: who,
      tag,
      icon: "/images/logo.png",
      renotify: false,
      data: { path, senderId: data.senderId, messagingType: "call_missed" },
    });
  }
}

/* ================= BACKGROUND MESSAGE ================= */
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] onBackgroundMessage", payload);
  const data = payload?.data || {};

  if (data.messagingType === "call" || data.messagingType === "call_cancel") {
    return handleCall(data); // la promesse garde le SW vivant pendant la sonnerie
  }

  const title = payload?.notification?.title || data.title || "Nouvelle notification";
  const body = payload?.notification?.body || data.content || "";

  const notificationData = {
    path: data.path || "/",
    adminSectionIndex: data.adminSectionIndex || "",
    adminPageIndex: data.adminPageIndex || "",
    messagingType: data.messagingType || "",
    senderId: data.senderId,
    receiverId: data.receiverId,
  };

  // L'enregistrement IndexedDB est fait dans l'écouteur "push" ci-dessus
  return self.registration.showNotification(title, {
    body,
    icon: "/images/logo.png",
    data: notificationData,
    tag: data.notifId || undefined, // évite le doublon avec l'affichage auto de FCM
    requireInteraction: true,
    actions: [{ action: "close", title: "Fermer" }],
  });
});

/* ================= MESSAGES DE LA PAGE ================= */
// La page prend le relais (modal + sonnerie) => on arrête la boucle du SW
self.addEventListener("message", (event) => {
  if (event.data?.type !== "STOP_RINGING") return;
  activeCalls.forEach((st, tag) => {
    st.cancelled = true;
    closeByTag(tag);
  });
});

/* ================= CLICK ================= */
self.addEventListener("notificationclick", (event) => {
  const d = event.notification.data || {};
  event.notification.close();

  if (event.action === "close") return;

  const isCall = d.messagingType === "call";
  if (isCall) {
    const st = activeCalls.get(callTag(d.senderId));
    if (st) st.cancelled = true; // stoppe la sonnerie
    if (event.action === "decline") return;
  }

  const base = d.path || "/";
  const target =
    isCall && event.action !== "decline"
      ? `${base}${base.includes("?") ? "&" : "?"}acceptCallFrom=${d.senderId}`
      : base;

  event.waitUntil(
    (async () => {
      const wins = await clients.matchAll({ type: "window", includeUncontrolled: true });
      if (wins.length) {
        const w = wins[0];
        await w.focus();
        if (isCall) w.postMessage({ type: "CALL_ACTION", action: event.action || "open", senderId: d.senderId });
      } else {
        await clients.openWindow(target);
      }
    })()
  );
});