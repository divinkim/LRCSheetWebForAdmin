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
  faBell,
  faCalculator,
  faFileInvoice,
  faMoneyBillWave,
  faReceipt,
  faBoxesStacked,
  faWarehouse,
  faTruck,
  faCartShopping,
  faHandshake,
  faChartPie,
  faGears,
  faBuildingFlag,
  faBriefcaseClock,
  faCalendarCheck,
  faFolderPlus,
  faFolderOpen,
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

/* ================= INDEXED DB (identique au service worker) ================= */
const DB_NAME = "NotificationDB";
const DB_VERSION = 3; // doit être identique au service worker
const STORE_NAME = "notifications";

function openNotificationDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    // IDENTIQUE au SW : crée le store quelle que soit la partie qui ouvre en premier
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getAndClearIndexedDBNotifications(): Promise<AppNotification[]> {
  const db = await openNotificationDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    let items: AppNotification[] = [];

    const req = store.getAll();
    req.onsuccess = () => {
      items = req.result || [];
      store.clear();
    };
    tx.oncomplete = () => {
      db.close();
      resolve(items);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error);
    };
  });
}

// "" / undefined / null => -1 (ne matche aucune section/page)
export const toIndex = (v: unknown): number =>
  v === undefined || v === null || v === "" ? -1 : Number(v);

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

  // Synchronisation des notifs reçues en arrière-plan (SW -> IndexedDB -> état)
  useEffect(() => {
    let busy = false;

    const sync = async () => {
      if (busy) return;
      busy = true;
      try {
        const bgNotifs = await getAndClearIndexedDBNotifications();
        if (bgNotifs.length > 0) {
          setNotifications((prev) => [...prev, ...bgNotifs]);
        }
      } catch (err) {
        console.error("Erreur IndexedDB:", err);
      } finally {
        busy = false;
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    const onSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "NOTIF_SAVED") sync();
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("notif-sync");
      bc.onmessage = (e) => {
        if (e.data?.type === "NOTIF_SAVED") sync();
      };
    } catch { }

    sync();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", sync);
    window.addEventListener("pageshow", sync);
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    return () => {
      bc?.close();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", sync);
      window.removeEventListener("pageshow", sync);
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
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
      notifications.filter((n) => toIndex(n.adminSectionIndex) === sectionIndex).length,
    [notifications]
  );

  const getPageCount = useCallback(
    (pageIndex: number) =>
      notifications.filter((n) => toIndex(n.adminPageIndex) === pageIndex).length,
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
          { title: "Messagerie & Chat", href: "/dashboard/COM/chat", icon: faComments, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
          { title: "Notifications générales", href: "/dashboard/COM/notification/list", icon: faBell, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
          { title: "Notifications groupées", href: "/dashboard/COM/notification/new", icon: faBullhorn, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
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
          { title: "Ajouter un congé", href: "/dashboard/RH/leave/new", icon: faCalendarCheck, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Liste des congés", href: "/dashboard/RH/leave/list", icon: faClipboardList, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
          { title: "ajouter un type de congé", href: "/dashboard/RH/leave-type/new", icon: faFolderPlus, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Liste des types de congés", href: "/dashboard/RH/leave-type/list", icon: faFolderOpen, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin", "Reception_Admin"]) },
        ],
      },
      {
        title: "⚙️ Administration",
        ItemLists: [
          { title: "Rapports", href: "/dashboard/ADMIN/reporting", icon: faFileLines, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau contrat", href: "/dashboard/ADMIN/contract/new", icon: faFileContract, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "List des contrats", href: "/dashboard/ADMIN/contract/list", icon: faFileLines, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau Département", href: "/dashboard/ADMIN/department/new", icon: faBuilding, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "liste des Départements", href: "/dashboard/ADMIN/department/list", icon: faBuildingFlag, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Nouveau Poste", href: "/dashboard/ADMIN/post/new", icon: faBriefcase, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "List des Postes", href: "/dashboard/ADMIN/post/list", icon: faBriefcaseClock, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
      {
        title: "💰 Comptabilité",
        ItemLists: [
          { title: "Ajouter un salaire", href: "/dashboard/COMPTA/salary/new", icon: faMoneyBillWave, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Liste des salaires", href: "/dashboard/ADMIN/salary/list", icon: faFileInvoice, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Bulletin de paie", href: "/dashboard/ADMIN/salary/details", icon: faReceipt, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Journal des dépenses", href: "/dashboard/COMPTA/expenses", icon: faCalculator, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
      {
        title: "📊 Fiscalité",
        ItemLists: [
          { title: "Ajouter un salaire", href: "/dashboard/COMPTA/salary/new", icon: faMoneyBillWave, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Liste des salaires", href: "/dashboard/ADMIN/salary/list", icon: faFileInvoice, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Déclarations & Taxes", href: "/dashboard/FISCAL/declarations", icon: faChartPie, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
      {
        title: "🛒 Ventes & CRM",
        ItemLists: [
          { title: "Clients & Leads", href: "/dashboard/CRM/clients", icon: faHandshake, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
          { title: "Devis & Commandes", href: "/dashboard/SALES/orders", icon: faCartShopping, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"]) },
        ],
      },
      {
        title: "📦 Stocks & Logistique",
        ItemLists: [
          { title: "Gestion des produits", href: "/dashboard/STOCK/products", icon: faBoxesStacked, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Entrepôts", href: "/dashboard/STOCK/warehouses", icon: faWarehouse, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Mouvements de stock", href: "/dashboard/STOCK/movements", icon: faTruck, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
        ],
      },
      {
        title: "🏢 Autres",
        ItemLists: [
          { title: "Ajouter une entreprise", href: "/dashboard/OTHERS/enterprise/new", icon: faCity, access: accessToPage(["Super_Admin_Platform"]) },
          { title: "Liste des entreprises", href: "/dashboard/OTHERS/enterprise/list", icon: faLandmark, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
          { title: "Paramètres généraux", href: "/dashboard/OTHERS/settings", icon: faGears, access: accessToPage(["Super_Admin_Platform", "Super_Admin_Enterprise"]) },
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