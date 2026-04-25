"use client";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsersGear, faUserPen, faUserPlus } from "@fortawesome/free-solid-svg-icons";

type Users = {
    lastname: string | null,
    firstname: string | null
    id: number,
    PlanningId: number,
    EnterpriseId: number,
    photo: string | null
}

type Plannings = {
    startTime: string,
    breakingStartTime: string,
    resumeEndTime: string,
    endTime: string,
    id: number,
    PlanningType: {
        title: string,
        description: string
    }
}

export default function AddOrEditUserPlanningOfWeek() {
    const [users, setUsers] = useState<Users[]>([]);
    const [plannings, setPlannings] = useState<Plannings[]>([]);
    const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
    useEffect(() => {
        (async () => {
            let EnterpriseId = localStorage.getItem("EnterpriseId");
            setEnterpriseId(EnterpriseId);

            const users = await providers.API.getAll(providers.APIUrl, "getUsers", null);

            if (Number(EnterpriseId) === 1) {
                const filterUserByEnterpriseId = users.filter((user: { EnterpriseId: number, adminService: string | null }) => [1, 2, 3, 4, null].includes(user.EnterpriseId));

                setUsers(filterUserByEnterpriseId);
                return;
            }
            const filterUserByEnterpriseId = users.filter((user: { EnterpriseId: number, adminService: string | null }) => user.EnterpriseId === Number(EnterpriseId) && user.adminService === null);
            setUsers(filterUserByEnterpriseId);
        })()
    }, []);

    useEffect(() => {
        (async () => {
            const plannings = await providers.API.getAll(providers.APIUrl, "getPlannings", null);
            const filterPlanningsByEnterpriseId = plannings.filter((planning: { EnterpriseId: number }) => planning.EnterpriseId === parseInt(enterpriseId ?? ""))
            setPlannings(filterPlanningsByEnterpriseId);
        })()
    }, [users])

    const weekDays = [
        { id: 1, day: "lundi" },
        { id: 2, day: "mardi" },
        { id: 3, day: "mercredi" },
        { id: 4, day: "jeudi" },
        { id: 5, day: "vendredi" },
        { id: 6, day: "samedi" },
        { id: 7, day: "dimanche" }
    ];

    const addEditUserPlanningOfWeek = {
        addUserInPlanningOfWeek: {
            titlePage: "Ajout d'un collaborateur au planning",
            path: "Dashboard/RH/ajouter au collaborateur au planning",
            links: [
                {
                    title: "Liste des collaborateurs associés",
                    icon: faUsersGear,
                    path: "/dashboard/RH/getUsersInPlanningOfWeek"
                },
                {
                    title: "Modifier le planning d'un collaborateur",
                    icon: faUserPen,
                    path: "/dashboard/RH/updateUserInPlanningOfWeek"
                }
            ]
        },
        updateUserInPlanningOfWeek: {
            titlePage: "Modifier le planning d'un collaborateur",
            path: "Dashboard/RH/Modification du planning d'un collaborateur",
            links: [
                {
                    title: "Liste des collaborateurs associés",
                    icon: faUsersGear,
                    path: "/dashboard/RH/Liste des collaborateurs au planning",
                },
                {
                    title: "Aujouter un collaborateur au planning",
                    icon: faUserPlus,
                    path: "/dashboard/RH/addUserInPlanningOfWeek"
                }
            ]
        },
    }

    return { users, addEditUserPlanningOfWeek, weekDays, plannings }
}
