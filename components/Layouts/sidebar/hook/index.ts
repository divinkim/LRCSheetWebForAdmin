import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faChevronDown, faChevronUp, faUser, faUserGroup, faBell, faPaperPlane, faList, faFileAlt, faShieldAlt,
    faUserClock, faUsers, faUserPlus, faClipboardList,
    faClipboardCheck, faCalendarCheck, faUserShield, faFileLines, faCheckCircle, faFileContract, faSuitcaseRolling,
    faCalendarDay, faUmbrellaBeach, faFileSignature, faIdBadge, faBuilding, faChartLine, faCreditCard,
    faMoneyBill1Wave,
    faFileInvoiceDollar,
    faBuildingCircleCheck,
    faBuildingColumns,
    faFileInvoice,
    faFileCircleCheck,
    faMoneyCheckDollar,
    faReceipt,
    faBalanceScale,
    faCalendarPlus,
    faGlobe,
    faCity,
    faHouseChimney, faPenToSquare,
    faMessage
} from "@fortawesome/free-solid-svg-icons";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";
import { onMessage } from "firebase/messaging";
import Swal from "sweetalert2";

type notificationProps = {
    path: string,
    adminSectionIndex: string,
    adminPageIndex: string,
    title: string,
    content: string,
}

export default function SidebarHook() {
    const [storedNotificationsArray, setStoredNotificationsArray] = useState<any[]>([]);
    const [count, setCount] = useState(0);
    const messaging = getFirebaseMessaging()
    const DB_NAME = "NotificationDB";
    const DB_VERSION = 2;
    const STORE_NAME = "notifications";

    function openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e: any) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { autoIncrement: true });
                }
            };

            request.onsuccess = (e: any) => resolve(e.target.result);
            request.onerror = (e) => reject(e);
        });
    }

    async function getAndClearNotifications() {
        const db = await openDB();

        return new Promise<any[]>((resolve) => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            const store = tx.objectStore(STORE_NAME);
            const req = store.getAll();

            req.onsuccess = () => {
                const data = req.result || [];
                store.clear();
                resolve(data);
            };
        });
    }

    //Réception des notifs entrantes
    useEffect(() => {
        (async () => {
            const local = localStorage.getItem("storedNotificationsArray");
            const current = local ? JSON.parse(local) : [];
            setStoredNotificationsArray(current);

            //Récupération de IndexedDB (site fermé)
            const backgroundNotifs = await getAndClearNotifications();

            if (backgroundNotifs.length > 0) {
                const merged = [...current, ...backgroundNotifs];
                setStoredNotificationsArray(merged);
                setCount(prevCount => prevCount + 1);
            }
        })();

        if (messaging) {
            const unsubscribe = onMessage(messaging, (remoteMessage) => {
                const EnterpriseId = localStorage.getItem("EnterpriseId");

                if (Number(remoteMessage.data?.EnterpriseId) === Number(EnterpriseId) && !remoteMessage.data?.page) {

                    const notif = {
                        path: remoteMessage.data?.path,
                        adminSectionIndex: remoteMessage.data?.adminSectionIndex,
                        adminPageIndex: remoteMessage.data?.adminPageIndex,
                        senderId: remoteMessage.data?.senderId,
                        receiverId: remoteMessage.data?.receiverId,
                    };

                    setStoredNotificationsArray((prev) => [...prev, notif]);
                    setCount(prevCount => prevCount + 1);

                    Swal.fire({
                        icon: "info",
                        title: "Notification entrante",
                        text: "Vous avez une nouvelle notification",
                        showCancelButton: true,
                        cancelButtonText: "Plus tard",
                        confirmButtonText: "Voir",
                    }).then((res) => {
                        if (res.isConfirmed) {
                            window.location.href = `${notif.path}`;
                        }
                    });
                } else if (Number(remoteMessage.data?.EnterpriseId) === Number(EnterpriseId) && remoteMessage.data?.page) {
                    
                }
            });

            return () => unsubscribe();
        }
        //Notifications live
    }, []);

    useEffect(() => {
        (() => {
            console.log("les notifs en question", storedNotificationsArray);
            if (storedNotificationsArray.length > 0) localStorage.setItem("storedNotificationsArray", JSON.stringify(storedNotificationsArray));
        })();
    }, [count]);

    const ItemAside = [
        // Onglet notifications
        {
            index: 0,
            title: "💬 Messagerie",
            ItemLists: [
                {
                    index: 0,
                    title: "Chat",
                    href: "/dashboard/NOTIF/chat",
                    icon: faMessage
                },
                // {
                //     index: 1,
                //     title: "notifications",
                //     href: "/dashboard/NOTIF/notifications",
                //     icon: faBell
                // },
            ]
        },

        // Onglet Ressources humaines
        {
            index: 2,
            title: "💼 RH",
            ItemLists: [
                {
                    index: 0,
                    title: "Présences au poste",
                    href: "/dashboard/RH/presencesList",
                    icon: faClipboardCheck
                },
                {
                    index: 1,
                    title: "Ajouter un collaborateur",
                    href: "/dashboard/RH/addUser",
                    icon: faUserPlus
                },
                {
                    index: 2,
                    title: "Liste des collaborateurs",
                    href: "/dashboard/RH/usersList",
                    icon: faUsers
                },
                {
                    index: 3,
                    title: "Ajouter un collaborateur au planning",
                    href: "/dashboard/RH/addUserInPlanningOfWeek",
                    icon: faCalendarPlus
                },
                {
                    index: 4,
                    title: "Liste des collaborateurs au planning",
                    href: "/dashboard/RH/getUsersInPlanningOfWeek",
                    icon: faCalendarCheck
                },
            ]
        },

        // Onglet Administration
        {
            index: 2,
            title: "🗂️ Administration",
            adminService: "ADMINISTRATION",
            ItemLists: [
                {
                    index: 0,
                    title: "Permissions",
                    href: "/dashboard/ADMIN/permission",
                    icon: faUserShield
                },
                {
                    index: 1,
                    title: "Rapports",
                    href: "/dashboard/ADMIN/repportsList",
                    icon: faFileLines
                },

                {
                    index: 2,
                    title: "Ajouter un contrat",
                    href: "/dashboard/ADMIN/addContract",
                    icon: faFileSignature
                },
                {
                    index: 3,
                    title: "Liste de contrat",
                    href: "/dashboard/ADMIN/listContrat",
                    icon: faFileContract
                },
                {
                    index: 4,
                    title: "Type de contrat",
                    href: "/dashboard/ADMIN/typeContrat",
                    icon: faFileContract
                },
                {
                    index: 5,
                    title: "Liste de Type de contrat",
                    href: "/dashboard/ADMIN/listTypeContrat",
                    icon: faFileContract
                },
                {
                    index: 6,
                    title: "Ajouter un poste",
                    href: "/dashboard/ADMIN/addPost",
                    icon: faIdBadge
                },
                {
                    index: 7,
                    title: "Liste de poste",
                    href: "/dashboard/ADMIN/postesList",
                    icon: faSuitcaseRolling
                },
                {
                    index: 8,
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addDepartment",
                    icon: faBuilding
                },
                {
                    index: 9,
                    title: "Liste de départements",
                    href: "/dashboard/ADMIN/departmentsList",
                    icon: faSuitcaseRolling
                }
            ]
        },

        // Onglet Comptabilité
        {
            index: 11,
            title: "💵 Comptabilité",
            ItemLists: [
                {
                    index: 0,
                    title: "Ajouter un salaire",
                    href: "/dashboard/COMPTA/addSalary",
                    icon: faMoneyBill1Wave  // salaire / paie
                },
                {
                    index: 1,
                    title: "Liste des salaires",
                    href: "/dashboard/COMPTA/salaryList",
                    icon: faFileInvoiceDollar  // récapitulatif des paies
                },
                {
                    index: 2,
                    title: "Factures clients",
                    href: "/home",
                    icon: faFileInvoice  // suivi des factures émises
                },
                {
                    index: 3,
                    title: "Factures fournisseurs",
                    href: "/home",
                    icon: faFileCircleCheck  // suivi des paiements fournisseurs
                },
                {
                    index: 4,
                    title: "Dépenses",
                    href: "/home",
                    icon: faMoneyCheckDollar  // gestion des dépenses courantes
                },
                {
                    index: 5,
                    title: "Rapports financiers",
                    href: "/home",
                    icon: faChartLine  // bilans, comptes de résultat, cash flow
                },
                {
                    index: 6,
                    title: "Taxes & TVA",
                    href: "/home",
                    icon: faReceipt  // déclarations fiscales, TVA, impôts
                },
                {
                    index: 7,
                    title: "Bilan annuel",
                    href: "/home",
                    icon: faBalanceScale  // bilan comptable
                },
            ]
        },
        // Onglet Statistiques
        {
            index: 12,
            title: "📊 Statistiques",
            ItemLists: [
                {
                    index: 0,
                    title: "Gain sur déduction",
                    href: "/home",
                    icon: faChartLine   // graphique linéaire pour gains/performances
                },
                {
                    index: 1,
                    title: "Gain sur abonnement",
                    href: "/home",
                    icon: faCreditCard  // abonnement/revenu, carte de paiement
                },
                {
                    index: 2,
                    title: "Bilan général",
                    href: "/dashboard/STATS/generalPlan",
                    icon: faFileAlt      // bilan/rapport général
                },
            ]
        },
        {
            index: 13,
            title: "🌍 Localités",
            ItemLists: [
                {
                    index: 0,
                    title: "Villes enregistrées",
                    href: "/dashboard/LOCALITY/citiesList",
                    icon: faCity
                },
                {
                    index: 1,
                    title: "Arrondissements enregistrées",
                    href: "/dashboard/LOCALITY/districtsList",
                    icon: faBuildingColumns
                },
                {
                    index: 2,
                    title: "Quartiers enregistrées",
                    href: "/dashboard/LOCALITY/quartersList",
                    icon: faHouseChimney
                },
            ]
        },
        // Onglet Autres
        {
            index: 14,
            title: "🧿 Autres",
            ItemLists: [
                {
                    index: 0,
                    title: "Enregistrer une entreprise",
                    href: "/dashboard/OTHERS/addEnterprise",
                    icon: faBuildingCircleCheck
                },
                {
                    index: 1,
                    title: "Liste des entreprises",
                    href: "/dashboard/OTHERS/enterprisesList",
                    icon: faBuildingColumns
                },
            ]
        },
    ];

    function getSectionNotificationsCount(sectionIndex: number) {
        const notificationArray = storedNotificationsArray.filter(notification => Number(notification.adminSectionIndex) === sectionIndex);
        return notificationArray.length;
    };

    function getPageNotificationsCount(pageIndex: number) {
        const notificationArray = storedNotificationsArray.filter(notification => Number(notification.adminPageIndex) === pageIndex);

        return notificationArray.length;
    }

    const getUserNotificationsCount = (UserId: string) => {
        const getNotificationsCount = storedNotificationsArray.filter((item: { senderId: string }) => item.senderId === UserId);
        return getNotificationsCount.length;
    }

    return { ItemAside, storedNotificationsArray, setStoredNotificationsArray, getSectionNotificationsCount, getPageNotificationsCount, getUserNotificationsCount };
}