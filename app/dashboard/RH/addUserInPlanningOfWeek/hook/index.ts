"use client";

import { useState, useEffect } from "react";
import { providers } from "@/index";
import AddOrEditUserPlanningOfWeek from "@/components/addEditUserPlanningOfWeek";
import { useToast } from "@/components/toast";

export type Users = {
    lastname: string | null;
    firstname: string | null;
    id: number;
    PlanningId: number;
    EnterpriseId: number;
    photo: string | null;
};

export type Plannings = {
    startTime: string;
    breakingStartTime: string;
    resumeEndTime: string;
    endTime: string;
    EnterpriseId: number;
    id: number;
    PlanningType: {
        title: string;
        description: string;
    };
};

export type Datas = {
    userId: number;
    weekDaysId: number[];
    planningsId: number[];
    EnterpriseId: number | null;
};

export default function useAddUserInPlanningOfWeek() {
    const [usersArray, setUsersArray] = useState<Users[]>([]);
    const [usersArrayCloned, setUsersArrayCloned] = useState<Users[]>([]);
    const { users, addEditUserPlanningOfWeek, weekDays, plannings } = AddOrEditUserPlanningOfWeek();
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    
    // Le state contient maintenant la liste des utilisateurs sélectionnés avec leurs données respectives
    const [datas, setDatas] = useState<Datas[]>([]);

    useEffect(() => {
        setUsersArray(users);
        setUsersArrayCloned(users);
    }, [users]);

    function onSearch(value: string) {
        const valueToLowerCase = value.toLowerCase();
        const filtered = usersArray.filter(user => {
            const lastname = user.lastname?.toLowerCase() || "";
            const firstname = user.firstname?.toLowerCase() || "";
            return lastname.includes(valueToLowerCase) || firstname.includes(valueToLowerCase);
        });
        setUsersArrayCloned(filtered);
    }

    function getFormatTime(date: string) {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[1].slice(0, 5);
    }

    // Gère l'ajout ou le retrait d'un utilisateur dans le tableau `datas`
    function handleToggleUser(user: Users) {
        setDatas(prev => {
            const exists = prev.some(item => item.userId === user.id);
            if (exists) {
                return prev.filter(item => item.userId !== user.id);
            } else {
                // Si des plannings ou jours ont déjà été sélectionnés globalement, on peut les réutiliser
                const currentPlannings = prev[0]?.planningsId || [];
                const currentWeekDays = prev[0]?.weekDaysId || [];
                
                return [
                    ...prev,
                    {
                        userId: user.id,
                        planningsId: currentPlannings,
                        weekDaysId: currentWeekDays,
                        EnterpriseId: user.EnterpriseId || null
                    }
                ];
            }
        });
    }

    // Met à jour la liste des plannings pour TOUS les utilisateurs actuellement sélectionnés
    function handleSelectPlanning(planningId: number) {
        setDatas(prev =>
            prev.map(item => ({
                ...item,
                // On remplace ou on pousse le planning selon vos besoins. Ici, on définit le planning choisi :
                planningsId: [planningId] 
            }))
        );
    }

    // Met à jour / bascule un jour de la semaine pour TOUS les utilisateurs sélectionnés
    function handleToggleWeekDay(dayId: number) {
        setDatas(prev =>
            prev.map(item => {
                const hasDay = item.weekDaysId.includes(dayId);
                const updatedWeekDays = hasDay
                    ? item.weekDaysId.filter(id => id !== dayId)
                    : [...item.weekDaysId, dayId];

                return {
                    ...item,
                    weekDaysId: updatedWeekDays
                };
            })
        );
    }

    async function handleSubmit() {
        try {
            if (datas.length === 0) {
                toast.error("Erreur", "Veuillez sélectionner au moins un collaborateur.");
                return;
            }

            const hasInvalidSelection = datas.some(
                item => item.weekDaysId.length === 0 || item.planningsId.length === 0
            );

            if (hasInvalidSelection) {
                toast.error(
                    "Erreur",
                    "Veuillez sélectionner un planning horaire ainsi qu'au moins un jour de la semaine pour le(s) collaborateur(s)."
                );
                return;
            }

            setIsLoading(true);

            // Envoi du tableau d'objets `datas` à l'API
            const response = await providers.API.post(
                "https://vps118934.serveur-vps.net:4001",
                "createCollaboratorPlanning",
                null,
                datas
            );

            if (response.status) {
                setDatas([]);
                toast.success(response.title, response.message);
            }
        } catch (error) {
            toast.error(
                "Erreur",
                error instanceof Error ? error.message : "Erreur inconnue"
            );
        } finally {
            setIsLoading(false);
        }
    }

    return {
        handleSubmit,
        onSearch,
        usersArrayCloned,
        addEditUserPlanningOfWeek,
        weekDays,
        plannings,
        isLoading,
        datas,
        getFormatTime,
        handleToggleUser,
        handleSelectPlanning,
        handleToggleWeekDay
    };
}