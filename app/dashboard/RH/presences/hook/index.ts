"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { AttendancesResponseDto, UsersResponseDto, User, AttendanceDto, AttendanceListDto } from "@/types/global";

// ==========================================
// TRI : date + heure, du plus récent au plus ancien
// ==========================================
// Une présence est positionnée dans le temps grâce à :
//  - arrivalTime : l'heure d'arrivée (ex: "08:10", "08:10:00" ou datetime ISO complet)
//  - createdAt   : fournit le JOUR de la présence quand arrivalTime ne contient que l'heure
// Si arrivalTime est vide (ex: absent), on se rabat sur createdAt.

const parseTime = (value?: string | null) => {
    if (!value) return null;
    const m = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    return { h: +m[1], min: +m[2], s: m[3] ? +m[3] : 0 };
};

// Transforme une présence en timestamp (ms)
const getAttendanceTimestamp = (item: AttendanceListDto): number => {
    const arrival = item?.arrivalTime ? String(item.arrivalTime).trim() : "";
    const createdMs = Date.parse(item?.createdAt ?? "");

    // Cas 1 : arrivalTime est déjà un datetime complet (ex: 2026-11-02T08:10:00Z)
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{1,2}:\d{2}/.test(arrival)) {
        const full = Date.parse(arrival.replace(" ", "T"));
        if (!isNaN(full)) return full;
    }

    // Cas 2 : arrivalTime ne contient que l'heure -> on prend le jour de createdAt
    const time = parseTime(arrival);
    if (time && !isNaN(createdMs)) {
        const day = new Date(createdMs);
        return new Date(
            day.getFullYear(),
            day.getMonth(),
            day.getDate(),
            time.h,
            time.min,
            time.s
        ).getTime();
    }

    // Cas 3 : pas d'heure d'arrivée exploitable -> createdAt seul
    return isNaN(createdMs) ? 0 : createdMs;
};

// Tri décroissant : 08:10 passe avant 08:05, et les dates récentes avant les anciennes
const sortByMostRecent = (list: AttendanceListDto[]): AttendanceListDto[] =>
    [...list].sort((a, b) => {
        const diff = getAttendanceTimestamp(b) - getAttendanceTimestamp(a);
        if (diff !== 0) return diff;
        // Égalité parfaite : l'enregistrement le plus récent (id le plus grand) d'abord
        return (b.id ?? 0) - (a.id ?? 0);
    });

// --- HOOK ---
export function PresencesListHookModal() {
    const { data: session, status } = useSession();

    // États de données
    const [presencesList, setPresencesList] = useState<AttendanceListDto[]>([]);
    const [presencesListCloned, setPresencesListCloned] = useState<AttendanceListDto[]>([]);
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
            localStorage.removeItem("prencencesData")
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
                    providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null),
                    providers.API.getAll<AttendancesResponseDto>(providers.APIUrl, "attendances", null),
                ]);

                // Filtrage des Utilisateurs selon le Rôle
                let filteredUsers: User[] = [];
                if (adminRole === "Super_Admin_Platform") {
                    filteredUsers = rawUsers.data;
                } else if (adminRole === "Super_Admin_Enterprise") {
                    filteredUsers = rawUsers.data.filter(
                        (item: User) => item.Enterprise?.MainEnterpriseId === mainEnterpriseId
                    );
                } else if (adminRole === "Enterprise_Admin") {
                    filteredUsers = rawUsers.data.filter(
                        (item: User) => item.EnterpriseId === enterpriseId
                    );
                }

                setUsers(filteredUsers);
                setUsersCloned(filteredUsers);

                // Filtrage des Présences selon le Rôle
                let filteredAttendances: AttendanceListDto[] = rawAttendances.data;
                if (adminRole === "Super_Admin_Platform") {
                    filteredAttendances = rawAttendances.data;
                } else if (adminRole === "Super_Admin_Enterprise") {
                    filteredAttendances = rawAttendances.data.filter(
                        item => item.Enterprise?.MainEnterpriseId === mainEnterpriseId
                    );
                } else if (adminRole === "Enterprise_Admin") {
                    filteredAttendances = rawAttendances.data.filter(
                        item => item.EnterpriseId === enterpriseId
                    );
                }

                // Tri : dates et heures les plus récentes en premier
                const sortedAttendances = sortByMostRecent(filteredAttendances);

                setPresencesList(sortedAttendances);
                setPresencesListCloned(sortedAttendances);
            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [adminRole, mainEnterpriseId, enterpriseId]);

    // Garantit l'ordre décroissant, même si un composant modifie la liste
    // via setPresencesListCloned (le tri est réappliqué à chaque changement)
    const sortedPresencesListCloned = useMemo(
        () => sortByMostRecent(presencesListCloned),
        [presencesListCloned]
    );

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
        presencesListCloned: sortedPresencesListCloned,
        adminRole,
        onSearch,
        onSelectAllUser,
        users,
        usersCloned,
        setUsersCloned,
        isLoading,
        setPresencesListCloned,
        setPresencesList,
    };
}
