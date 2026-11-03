import { providers } from "@/index";
import { NotificationDto, NotificationsResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";



export function useNotification() {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const { data: session, status } = useSession();
    const adminRole = (session?.user as any)?.adminRole ?? "";
    const enterpriseId = (session?.user as any)?.EnterpriseId ?? "";
    useEffect(() => {
        (async () => {
            try {
                const notifications = await providers.API.getAll<NotificationsResponseDto>(
                    providers.APIUrl,
                    "notifications",
                    null
                );
                let filterdNotifications = notifications.data;

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