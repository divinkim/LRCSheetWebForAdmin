type UsersDatas = {
    id: number,
    firstname: string | null | undefined,
    lastname: string | null | undefined,
    phone: string | null | undefined,
    address: string | null | undefined,
    birthDate: string | null | undefined,
    email: string | null | undefined,
    status: boolean | null,
    gender: string | null | undefined,
    photo: string | null | undefined,
    Enterprise: {
        name: string | null | undefined,
        logo: string | null | undefined
    },

}

type WeekDaysPlannings = {
    WeekDaysId: number,
    PlanningTypeId: number,
    PlanningId: number,
    EnterpriseId: number,
    Enterprise: {
        name: string | null,
        logo: string | null
    }
    WeekDays: {
        name: string,
    },
    PlanningType: {
        title: string,
    },
    Planning: {
        startTime: string,
        breakingStartTime: string,
        resumeEndTime: string,
        endTime: string
    },
    UserId: number,
    User: {
        firstname: string,
        lastname: string,
        photo: string | null,
    }
}

import { useState, useEffect } from "react";
import { providers } from "@/index";

export default function useGetUsersInPlanningOfWeek() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);             // page courante
    const limit = 5;                                 // items par page

    const [usersList, setUsersList] = useState<UsersDatas[]>([]);
    const [savedUsersList, setSavedUsersList] = useState<UsersDatas[]>([]);
    const [weekDaysPlannings, setWeekDaysPlannings] = useState<WeekDaysPlannings[]>([])
    const [weekDaysPlanningsSaved, setWeekDaysPlanningsSaved] = useState<WeekDaysPlannings[]>([])

    const [getAdminRole, setAdminRole] = useState<string | null>(null);
    const [loading, setIsLoading] = useState(false);
    const requireRoles = ['Super-Admin', 'Supervisor-Admin'];

    useEffect(() => {
        if (typeof (window) === "undefined") return;
        (async () => {
            const getAdminRole = window?.localStorage.getItem("adminRole");
            setAdminRole(getAdminRole);

            const authToken = window?.localStorage.getItem("authToken");
            if (authToken === null) {
                window.location.href = "/"
            }

            let EnterpriseId = window?.localStorage.getItem("EnterpriseId");

            const request = await providers.API.getAll(providers.APIUrl, "getAllUsersPlanningsOfWeek", null);
            if (Number(EnterpriseId) === 1) {
                const filterWeekDaysPlanningsByEnterpriseId = request.filter((item: { EnterpriseId: number }) => [1, 2, 3, 4, null].includes(item.EnterpriseId))
                setWeekDaysPlannings(filterWeekDaysPlanningsByEnterpriseId);
                setWeekDaysPlanningsSaved(filterWeekDaysPlanningsByEnterpriseId);
                return;
            }
            const filterWeekDaysPlanningsByEnterpriseId = request.filter((item: { EnterpriseId: number }) => item.EnterpriseId === (Number(EnterpriseId)))
            setWeekDaysPlannings(filterWeekDaysPlanningsByEnterpriseId);
            setWeekDaysPlanningsSaved(filterWeekDaysPlanningsByEnterpriseId);
        })();
    }, []);

    // 🔎 Filtrer par recherche
    function onSearch(value: string) {
        let filtered = weekDaysPlannings.filter(item => item?.User?.lastname?.toLowerCase()?.includes(value.toLowerCase()) || item?.User?.firstname?.toLowerCase()?.includes(value.toLowerCase()));
        setWeekDaysPlanningsSaved(filtered)
    }

    return {onSearch}
}