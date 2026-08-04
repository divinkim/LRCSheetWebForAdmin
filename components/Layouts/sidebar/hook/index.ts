"use client";

import { useEffect, useState, useCallback } from "react";
import socket from "@/socket";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";
import { onMessage } from "firebase/messaging";

import {
  faComments,
  faBullhorn,
  faCalendarPlus,
  faClipboardList,
  faUserPlus,
  faUsers,
  faUserCheck,
  faCalendarDays,
  faFileLines,
  faFileContract,
  faBuilding,
  faBriefcase,
  faBuildingCircleCheck,
  faCity,
} from "@fortawesome/free-solid-svg-icons";

export interface AppNotification {
  path?: string;
  adminSectionIndex?: number | string;
  adminPageIndex?: number | string;
  senderId?: number | string;
  receiverId?: number | string;
}

const STORAGE_KEY = "storedNotificationsArray";

// ==========================================
// 1. Hook de gestion des notifications
// ==========================================
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  });

  // Persistance automatique dans localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Sync IndexedDB au chargement
  useEffect(() => {
    async function syncBackgroundNotifications() {
      try {
        const bgNotifs = await getAndClearIndexedDBNotifications();
        if (bgNotifs.length > 0) {
          setNotifications((prev) => [...prev, ...bgNotifs]);
        }
      } catch (err) {
        console.error("Erreur IndexedDB:", err);
      }
    }
    syncBackgroundNotifications();
  }, []);

  // Firebase Push Notifications
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (remoteMessage) => {
      const enterpriseId = localStorage.getItem("EnterpriseId");
      if (Number(remoteMessage.data?.EnterpriseId) === Number(enterpriseId)) {
        const newNotif: AppNotification = {
          path: remoteMessage.data?.path,
          adminSectionIndex: remoteMessage.data?.adminSectionIndex,
          adminPageIndex: remoteMessage.data?.adminPageIndex,
          senderId: remoteMessage.data?.senderId,
          receiverId: remoteMessage.data?.receiverId,
        };
        setNotifications((prev) => [...prev, newNotif]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sockets WebSockets
  useEffect(() => {
    const userId = localStorage.getItem("UserId");

    const handleChatData = (data: AppNotification) => {
      if (String(data.receiverId) === String(userId)) {
        setNotifications((prev) => [...prev, data]);
      }
    };

    const handleRemoveNotifications = (data: { senderId: number; receiverId: number }) => {
      setNotifications((prev) =>
        prev.filter(
          (item) =>
            String(item.senderId) !== String(data.senderId) ||
            String(item.receiverId) !== String(data.receiverId)
        )
      );
    };

    socket.on("getChatData", handleChatData);
    socket.on("removeNotificationsCount", handleRemoveNotifications);

    return () => {
      socket.off("getChatData", handleChatData);
      socket.off("removeNotificationsCount", handleRemoveNotifications);
    };
  }, []);

  const getSectionCount = useCallback(
    (sectionIndex: number) =>
      notifications.filter((n) => Number(n.adminSectionIndex) === sectionIndex).length,
    [notifications]
  );

  const getPageCount = useCallback(
    (pageIndex: number) =>
      notifications.filter((n) => Number(n.adminPageIndex) === pageIndex).length,
    [notifications]
  );

  const getUserCount = useCallback(
    (userId: string) =>
      notifications.filter((n) => String(n.senderId) === String(userId)).length,
    [notifications]
  );

  useEffect(() => {
    const socketData = (data: { senderId: number; receiverId: number }) => {
      const local = localStorage.getItem("storedNotificationsArray");
      const stored: { senderId: string; receiverId: string }[] = local ? JSON.parse(local) : [];
      const count = stored.filter(
        (item) =>
          Number(item.senderId) !== data.receiverId && Number(item.receiverId) !== data.senderId
      );
      setNotifications(count);
      localStorage.setItem("storedNotificationsArray", JSON.stringify(count));
    };
    socket.on("removeNotificationsCount", socketData);
    return () => {
      socket.off("removeNotificationsCount", socketData);
    };
  }, []);

  return {
    notifications,
    setNotifications,
    getSectionCount,
    getPageCount,
    getUserCount,
  };
}

// Helper IndexedDB
async function getAndClearIndexedDBNotifications(): Promise<AppNotification[]> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("NotificationDB", 2);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("notifications")) return resolve([]);

      const tx = db.transaction("notifications", "readwrite");
      const store = tx.objectStore("notifications");
      const getAllReq = store.getAll();

      getAllReq.onsuccess = () => {
        store.clear();
        resolve(getAllReq.result || []);
      };
    };
  });
}

// ==========================================
// 2. Hook complet pour la Sidebar (SidebarHook)
// ==========================================
export function SidebarHook() {
  const {
    notifications: storedNotificationsArray,
    setNotifications: setStoredNotificationsArray,
    getSectionCount: getSectionNotificationsCount,
    getPageCount: getPageNotificationsCount,
  } = useNotifications();

  // Menu dynamique avec icônes pro et pertinentes
  const ItemAside = [
    {
      title: "💬 Communication",
      ItemLists: [
        { title: "Messagerie & Tchat", href: "/dashboard/NOTIF/chat", icon: faComments },
        { title: "Notifications groupées", href: "/dashboard/NOTIF/notifications", icon: faBullhorn },
      ],
    },
    {
      title: "🛎️ Réception & RDV",
      ItemLists: [
        { title: "Nouveau rendez-vous", href: "/dashboard/APPOINTMENT/new", icon: faCalendarPlus },
        { title: "Liste des rendez-vous", href: "/dashboard/APPOINTMENT/list", icon: faClipboardList },
      ],
    },
    {
      title: "👥 Gestion RH",
      ItemLists: [
        { title: "Ajouter un collaborateur", href: "/dashboard/RH/user/new", icon: faUserPlus },
        { title: "Liste des collaborateurs", href: "/dashboard/RH/users", icon: faUsers },
        { title: "Présences", href: "/dashboard/RH/presences", icon: faUserCheck },
        { title: "Nouveau planning", href: "/dashboard/RH/planning/new", icon: faCalendarPlus },
        { title: "Plannings horaires", href: "/dashboard/RH/roster", icon: faCalendarDays },
      ],
    },
    {
      title: "⚙️ Administration",
      ItemLists: [
        { title: "Rapports", href: "/dashboard/ADMIN/reporting", icon: faFileLines },
        { title: "Nouveau contrat", href: "/dashboard/ADMIN/contract/new", icon: faFileContract },
        { title: "Nouveau Département", href: "/dashboard/ADMIN/department/new", icon: faBuilding },
        { title: "Nouveau Poste", href: "/dashboard/ADMIN/post/new", icon: faBriefcase },
      ],
    },
    {
      title: "🏢 Autres",
      ItemLists: [
        { title: "Ajouter une entreprise", href: "/dashboard/OTHERS/enterprise/new", icon: faBuildingCircleCheck },
        { title: "Liste des entreprises", href: "/dashboard/OTHERS/enterprise/list", icon: faCity },
      ],
    },
  ];

  return {
    ItemAside,
    getSectionNotificationsCount,
    getPageNotificationsCount,
    storedNotificationsArray,
    setStoredNotificationsArray,
  };
}