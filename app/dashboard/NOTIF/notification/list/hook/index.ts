import { providers } from "@/index";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export interface Notification {
    id: number;
    title: string | null;
    description: string | null;
    fcmToken: string | null;
    UserId: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    EnterpriseId: number | null;
    Enterprise?: {
        logo: string | null,
        MainEnterpriseId: string | null,
    }
    User?: {
        id: number;
        firstname?: string;
        lastname?: string;
        email?: string
    } | null;
}

export function useNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const { data: session, status } = useSession();
    const adminRole = (session?.user as any)?.adminRole ?? "";
    const enterpriseId = (session?.user as any)?.EnterpriseId ?? "";
    useEffect(() => {
        (async () => {
            try {
                const notifications = await providers.API.getAll(
                    "https://vps118934.serveur-vps.net:4001",
                    "notifications",
                    null
                );
                let filterdNotifications: Notification[] = notifications;
        
                if (adminRole === "Super_Admin_Platform") {
                    setNotifications(filterdNotifications)
                } else if (adminRole === "Super_Admin_Enterprise") {
                    filterdNotifications.filter(item => Number(item?.Enterprise?.MainEnterpriseId) === Number(enterpriseId));
                    setNotifications(filterdNotifications)
                } else if (adminRole === "Enterprise_Admin") {
                    filterdNotifications.filter(item => Number(item?.EnterpriseId) === Number(enterpriseId));
                    setNotifications(filterdNotifications)
                } else if (adminRole === "Reception_Admin") {
                    filterdNotifications.filter(item => Number(item?.EnterpriseId) === Number(enterpriseId) && item.title === "Visite");
                    setNotifications(filterdNotifications)
                }
            } catch (error) {
                console.log(error)
            } finally {
                setLoadingData(false)
            }
        })()
    }, [session]);

    return {
        loadingData,
        notifications,
        setNotifications, setLoadingData
    }
}