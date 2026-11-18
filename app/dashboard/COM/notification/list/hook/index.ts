import { providers } from "@/index";
import { NotificationDto, NotificationsResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";



export function useNotification() {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const { data: session, status } = useSession();
    const [adminId, setAdminId] = useState<number | null>(null);
    useEffect(() => {
        (async () => {
            try {
                if (!session?.user) return;
                const adminRole = (session?.user as any)?.adminRole ?? "";
                const enterpriseId = (session?.user as any)?.EnterpriseId ?? "";
                const adminId = (session?.user as any)?.id ?? "";
                const notifications = await providers.API.getAll<NotificationsResponseDto>(
                    providers.APIUrl,
                    "notifications",
                    null
                );
                let filterdNotifications = notifications.data;

                if (adminRole === "SUPER_ADMIN_PLATFORM") {
                    setNotifications(filterdNotifications)
                } else if (adminRole === "SUPER_ADMIN_ENTERPRISE") {
                    filterdNotifications.filter(item => Number(item?.Enterprise?.MainEnterpriseId) === Number(enterpriseId));
                    setNotifications(filterdNotifications)
                } else if (adminRole === "ENTERPRISE_ADMIN") {
                    filterdNotifications.filter(item => Number(item?.EnterpriseId) === Number(enterpriseId));
                    setNotifications(filterdNotifications)
                } else if (adminRole === "Reception_Admin") {
                    filterdNotifications.filter(item => Number(item?.EnterpriseId) === Number(enterpriseId) && item.title === "Visite");
                    setNotifications(filterdNotifications)
                }
                setAdminId(adminId);
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
        setNotifications, setLoadingData,
        adminId
    }
}