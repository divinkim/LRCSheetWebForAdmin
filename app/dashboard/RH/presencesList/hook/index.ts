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

type User = {
    lastname: string | null,
    firstname: string | null,
    PlanningId: number,
    SalaryId: number,
    EnterpriseId: number,
    photo: string | null,
    id: number
}

export function PresencesListHookModal() {
    const [presencesList, setPresencesList] = useState<PresencesDatas[]>([]);
    const [presencesListCloned, setPresencesListCloned] = useState<PresencesDatas[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [usersCloned, setUsersCloned] = useState<User[]>([]);
    const [adminRole, setAdminRole] = useState<string>("");

    useEffect(() => {
        if (typeof (window) === "undefined") return
        const role = window?.localStorage.getItem("adminRole");;
        setAdminRole(role ?? "");
    }, []);

    useEffect(() => {
        (async () => {
            const users = await providers.API.getAll("https://vps118934.serveur-vps.net:4001", "getUsers", null);
            setUsers(users);
            setUsersCloned(users);
        })()
    }, [])


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

        // if (page === "addPresenceModal" || page === "updatePresenceModal") {
        //     return setPresencesListCloned([usersFiltered[0]])
        // }

        setPresencesListCloned(usersFiltered);
    }
  

    const onSelectAllUser = () => {
        const allIds = users.filter(item => item.id && item.EnterpriseId && item.PlanningId && item.SalaryId);
        const getEnterprisesId = allIds.map(item => item.EnterpriseId);
        const getUsersId = allIds.map(item => item.id);
        const getSalariesId = allIds.map(item => item.SalaryId);
        const getPlanningId = allIds.map(item => item.PlanningId);

        return {
            allIds,
            getEnterprisesId,
            getUsersId,
            getSalariesId,
            getPlanningId
        }
    }

    return { presencesListCloned, adminRole, onSearch, onSelectAllUser, users, usersCloned, setUsersCloned }
}