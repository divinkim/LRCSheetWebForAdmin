"use client";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsersGear, faUserPen, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { Planning, PlanningsResponseDto, User, UsersResponseDto } from "@/types/global";

import { useSession } from "next-auth/react";
export default function AddOrEditUserPlanningOfWeek() {
    const [users, setUsers] = useState<User[]>([]);
    const [plannings, setPlannings] = useState<Planning[]>([]);
    const [EnterpriseId, setEnterpriseId] = useState<number>(0);
    const { data: session } = useSession()
    useEffect(() => {
        (async () => {
            let EnterpriseId = Number((session?.user as any)?.EnterpriseId);
            setEnterpriseId(EnterpriseId);

            const users = await providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null);


            const filterUserByEnterpriseId = users.data.filter(user =>
                user.Enterprise.MainEnterpriseId === EnterpriseId
            );
            setUsers(filterUserByEnterpriseId);
        })()
    }, [session]);

    useEffect(() => {
        (async () => {
            const plannings = await providers.API.getAll<PlanningsResponseDto>(
                providers.APIUrl,
                "plannings",
                null
            );
            const filterPlanningsByEnterpriseId = plannings.data.filter((planning: { EnterpriseId: number }) => planning.EnterpriseId === EnterpriseId)
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
                    path: "/dashboard/RH/roster"
                },
                {
                    title: "Modifier le planning d'un collaborateur",
                    icon: faUserPen,
                    path: "/dashboard/RH/roster/edit"
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
                    path: "/dashboard/RH/roster",
                },
                {
                    title: "Ajouter un collaborateur au planning",
                    icon: faUserPlus,
                    path: "/dashboard/RH/roster/new"
                }
            ]
        },
    }

    return { users, addEditUserPlanningOfWeek, weekDays, plannings }
}
