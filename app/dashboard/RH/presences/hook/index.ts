"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";

type PresencesDatas = {
    arrivalTime: string | null;
    departureTime: string | null;
    breakStartTime: string | null;
    resumeTime: string | null;
    UserId: number;
    mounth: number | null;
    day: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    status: string | null;
    EnterpriseId: number;
    SalaryId: number;
    PlanningId: number;
    User: {
        firstname: string | null;
        lastname: string | null;
        photo: string | null;
    };
    Planning: {
        startTime: string | null;
        breakingStartTime: string | null;
        resumeEndTime: string | null;
        endTime: string | null;
    };
    Enterprise: {
        name: string | null;
        logo: string | null;
        MainEnterpriseId?: number | null;
    };
};

type User = {
    id: number;
    lastname: string | null;
    firstname: string | null;
    PlanningId: number;
    SalaryId: number;
    EnterpriseId: number;
    photo: string | null;
    Enterprise?: {
        MainEnterpriseId: number;
    };
};

const API_BASE_URL = "https://vps118934.serveur-vps.net:4001";

// --- HOOK ---
export function PresencesListHookModal() {
    const { data: session, status } = useSession();

    // États de données
    const [presencesList, setPresencesList] = useState<PresencesDatas[]>([]);
    const [presencesListCloned, setPresencesListCloned] = useState<PresencesDatas[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [usersCloned, setUsersCloned] = useState<User[]>([]);

    const [adminRole, setAdminRole] = useState<string>("");
    const [mainEnterpriseId, setMainEnterpriseId] = useState<number | null>(null);
    const [enterpriseId, setEnterpriseId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    //Charger les infos de la session
    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const user = session.user as any;
            setAdminRole(user?.adminRole || "");
            setMainEnterpriseId(user?.MainEnterpriseId ? Number(user.MainEnterpriseId) : null);
            setEnterpriseId(user?.EnterpriseId ? Number(user.EnterpriseId) : null);
        }
    }, [session, status]);

    //Charger les utilisateurs et les présences une fois le rôle connu
    useEffect(() => {
        if (!adminRole) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Appels parallèles pour optimiser le temps de chargement
                const [rawUsers, rawAttendances] = await Promise.all([
                    providers.API.getAll(API_BASE_URL, "getUsers", null),
                    providers.API.getAll(API_BASE_URL, "getAllAttendances", null),
                ]);

                // Filtrage des Utilisateurs selon le Rôle
                let filteredUsers: User[] = [];
                if (adminRole === "Super_Admin_Platform") {
                    filteredUsers = rawUsers;
                } else if (adminRole === "Super_Admin_Enterprise") {
                    filteredUsers = rawUsers.filter(
                        (item: User) => item.Enterprise?.MainEnterpriseId === mainEnterpriseId
                    );
                } else if (adminRole === "Enterprise_Admin") {
                    filteredUsers = rawUsers.filter(
                        (item: User) => item.EnterpriseId === enterpriseId
                    );
                }

                setUsers(filteredUsers);
                setUsersCloned(filteredUsers);

                // Filtrage des Présences selon le Rôle
                let filteredAttendances: PresencesDatas[] = [];
                if (adminRole === "Super_Admin_Platform") {
                    filteredAttendances = rawAttendances;
                } else if (adminRole === "Super_Admin_Enterprise") {
                    filteredAttendances = rawAttendances.filter(
                        (item: PresencesDatas) => item.Enterprise?.MainEnterpriseId === mainEnterpriseId
                    );
                } else if (adminRole === "Enterprise_Admin") {
                    filteredAttendances = rawAttendances.filter(
                        (item: PresencesDatas) => item.EnterpriseId === enterpriseId
                    );
                }

                setPresencesList(filteredAttendances);
                setPresencesListCloned(filteredAttendances);
                console.log(filteredAttendances)
            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [adminRole, mainEnterpriseId, enterpriseId]);

    // Recherche d'un utilisateur par prénom/nom
    const onSearch = (value: string) => {
        const query = value.toLowerCase().trim();
        if (!query) {
            setPresencesListCloned(presencesList);
            return;
        }

        const filtered = presencesList.filter((item) => {
            const firstname = item?.User?.firstname?.toLowerCase() || "";
            const lastname = item?.User?.lastname?.toLowerCase() || "";
            return firstname.includes(query) || lastname.includes(query);
        });

        setPresencesListCloned(filtered);
    };

    // Sélection globale des IDs valides
    const onSelectAllUser = () => {
        const validUsers = users.filter(
            (item) => item.id && item.EnterpriseId && item.PlanningId && item.SalaryId
        );

        return {
            allIds: validUsers,
            getEnterprisesId: validUsers.map((item) => item.EnterpriseId),
            getUsersId: validUsers.map((item) => item.id),
            getSalariesId: validUsers.map((item) => item.SalaryId),
            getPlanningId: validUsers.map((item) => item.PlanningId),
        };
    };

    return {
        presencesListCloned,
        adminRole,
        onSearch,
        onSelectAllUser,
        users,
        usersCloned,
        setUsersCloned,
        isLoading,
    };
}