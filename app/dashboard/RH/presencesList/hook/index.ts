"use client";
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type PresencesDatas = {
    arrivalTime: string | null,
    departureTime: string | null,
    breakStartTime: string | null,
    resumeTime: string | null,
    UserId: number,
    mounth: number | null,
    day: string | null,
    createdAt: string | null
    updatedAt: string | null,
    status: string | null
    EnterpriseId: number,
    SalaryId: number,
    PlanningId: number,
    User: {
        firstname: string | null,
        lastname: string | null,
        photo: string | null,
    },
    Planning: {
        startTime: string | null,
        breakingStartTime: string | null,
        resumeEndTime: string | null,
        endTime: string | null,
    },
    Enterprise: {
        name: string | null,
        logo: string | null,
    }
}

export function PresencesListHookModal() {
    const [presencesList, setPresencesList] = useState<PresencesDatas[]>([]);
    const [presencesListCloned, setPresencesListCloned] = useState<PresencesDatas[]>([]);
    const [currentMonthValue, setCurrenMonthValue] = useState(new Date().getMonth());
    const [savedPresencesList, setSavedPresencesList] = useState<PresencesDatas[]>([]);
    const [searchValue, setSearchValue] = useState("");
    const [pageName, setPageName] = useState("")
    const [page, setPage] = useState(1);             // page courante
    const limit = 5;                                 // items par page
    const [isLoading, setIsLoading] = useState(false);
    const [showAddPresenceModal, setShowAddPresenceModal] = useState(false);
    const [showUpdatePresenceModal, setShowUpdatePresenceModal] = useState(false);
    const requireAdminRoles = ['Super-Admin', 'Supervisor-Admin'];

    const [createdAt, setCreatedAt] = useState<string | null>(null);
    const [adminRole, setAdminRole] = useState<string>("");

    useEffect(() => {
        if (typeof (window) === "undefined") return
        const role = window?.localStorage.getItem("adminRole");;
        setAdminRole(role ?? "");
    }, []);

    useEffect(() => {
        (async () => {
            const presencesList = await providers.API.getAll(providers.APIUrl, "getAllAttendances", null);
            if (Array.isArray(presencesList)) {
                setPresencesList(presencesList);
                setPresencesListCloned(presencesList)
            }
        })()
    }, []);

    function onSearch(value: string, page: string) {
        const usersFiltered = presencesList.filter(user => user?.User?.firstname?.toString()?.toLowerCase()?.includes(value.toLowerCase()) || user?.User?.lastname?.toString()?.toLowerCase()?.includes(value.toLowerCase()));

        if (page === "addPresenceModal" || page === "updatePresenceModal") {
            return setPresencesListCloned([usersFiltered[0]])
        }

        setPresencesListCloned(usersFiltered);
    }
    //Mise à jour de l'utilisateur recherché
   
    const onSelectAllUser = () => {
        const allIds = presencesList.filter(user => user.UserId && user?.EnterpriseId && user?.SalaryId);
        const getEnterprisesIds = allIds.map(item => item.EnterpriseId);
        const getUsersIds = allIds.map(item => item.UserId);
        const getSalariesIds = allIds.map(item => item.SalaryId);

        return { allIds, getEnterprisesIds, getUsersIds, getSalariesIds}
    }

    return { presencesListCloned, adminRole, onSearch, onSelectAllUser}
}