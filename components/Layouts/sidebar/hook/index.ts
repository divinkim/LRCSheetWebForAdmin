"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  faCity,
  faLandmark,
} from "@fortawesome/free-solid-svg-icons";
import { useSession } from "next-auth/react";

export interface AppNotification {
  path?: string;
  adminSectionIndex?: number | string;
  adminPageIndex?: number | string;
  senderId?: number | string;
  receiverId?: number | string;
  messagingType?: string;
}

const STORAGE_KEY = "storedNotificationsArray";

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

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window === "undefined") return [];
    const local = localStorage.getItem(STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  });
  const { data: session } = useSession();
  const enterpriseId = Number((session?.user as any)?.EnterpriseId || "");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

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

  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (!messaging) return;

    const unsubscribe = onMessage(messaging, (remoteMessage) => {
      console.log(remoteMessage);
      const newNotif: AppNotification = {
        path: remoteMessage.data?.path,
        adminSectionIndex: remoteMessage.data?.adminSectionIndex,
        adminPageIndex: remoteMessage.data?.adminPageIndex,
        senderId: remoteMessage.data?.senderId,
        receiverId: remoteMessage.data?.receiverId,
        messagingType: remoteMessage.data?.messagingType,
      };
      setNotifications((prev) => [...prev, newNotif]);
    });

    return () => unsubscribe();
  }, []);

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

  return {
    notifications,
    setNotifications,
    getSectionCount,
    getPageCount,
    getUserCount,
  };
}

export function SidebarHook() {
  const {
    notifications: storedNotificationsArray,
    setNotifications: setStoredNotificationsArray,
    getSectionCount: getSectionNotificationsCount,
    getPageCount: getPageNotificationsCount,
  } = useNotifications();

  const { data: session } = useSession();
  const adminRole = String((session?.user as any)?.adminRole || "");

  const accessToPage = useCallback(
    (adminRoles: string[]) => {
      return adminRoles.includes(adminRole);
    },
    [adminRole]
  );

  const ItemAside = useMemo(() => {
    return [
      {
        title: "💬 Communication",
        ItemLists: [
          { title: "Messagerie & Tchat", href: "/dashboard/NOTIF/chat", icon: faComments, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
          { title: "Notifications", href: "/dashboard/NOTIF/notification/list", icon: faBullhorn, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
          { title: "Notifications groupées", href: "/dashboard/NOTIF/notification/new", icon: faBullhorn, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
        ],
      },
      {
        title: "🪪 Réception & RDV",
        ItemLists: [
          { title: "Nouveau rendez-vous", href: "/dashboard/APPOINTMENT/new", icon: faCalendarPlus, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
          { title: "Liste des rendez-vous", href: "/dashboard/APPOINTMENT/list", icon: faClipboardList, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
        ],
      },
      {
        title: "👥 Gestion RH",
        ItemLists: [
          { title: "Ajouter un collaborateur", href: "/dashboard/RH/user/new", icon: faUserPlus, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Liste des collaborateurs", href: "/dashboard/RH/users", icon: faUsers, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Présences", href: "/dashboard/RH/presences", icon: faUserCheck, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau planning", href: "/dashboard/RH/planning/new", icon: faCalendarPlus, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Plannings horaires", href: "/dashboard/RH/roster", icon: faCalendarDays, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
        ],
      },
      {
        title: "⚙️ Administration",
        ItemLists: [
          { title: "Rapports", href: "/dashboard/ADMIN/reporting", icon: faFileLines, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau contrat", href: "/dashboard/ADMIN/contract/new", icon: faFileContract, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau Département", href: "/dashboard/ADMIN/department/new", icon: faBuilding, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau Poste", href: "/dashboard/ADMIN/post/new", icon: faBriefcase, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
      {
        title: "🏢 Autres",
        ItemLists: [
          { title: "Ajouter une entreprise", href: "/dashboard/OTHERS/enterprise/new", icon: faCity, access: accessToPage(["Super_Admin_Platform"]) },
          { title: "Liste des entreprises", href: "/dashboard/OTHERS/enterprise/list", icon: faLandmark, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
    ];
  }, [accessToPage]);

  return {
    ItemAside,
    getSectionNotificationsCount,
    getPageNotificationsCount,
    storedNotificationsArray,
    setStoredNotificationsArray,
  };
}