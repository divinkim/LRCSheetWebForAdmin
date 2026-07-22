"use client";
type Users = {
    lastname: string | null,
    firstname: string | null,
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
    EnterpriseId: number,
    id: number,
    PlanningType: {
        title: string,
        description: string
    }
}

type Datas = {
    usersId: number[],
    weekDaysId: number[],
    PlanningsId: number[],
    EnterpriseId: number | null
}

import { useState, useEffect } from "react";
import { providers } from "@/index";
import AddOrEditUserPlanningOfWeek from "@/components/addEditUserPlanningOfWeek";
import { useToast } from "@/components/toast";

export default function useAddUserInPlanningOfWeek() {
    const [usersArray, setUsersArray] = useState<Users[]>([]);
    const [usersArrayCloned, setUsersArrayCloned] = useState<Users[]>([]);
    const { users, addEditUserPlanningOfWeek, weekDays, plannings } = AddOrEditUserPlanningOfWeek();
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const [datas, setDatas] = useState<Datas>({
        usersId: [],
        weekDaysId: [],
        PlanningsId: [],
        EnterpriseId: 0
    });

    useEffect(() => {
        (() => {
            setUsersArray(users);
            setUsersArrayCloned(users);
        })();
    }, [users]);


    function onSearch(value: string) {
        const valueToLowerCase = value.toLowerCase();
        const users = usersArray.filter(user => {
            const lastname = user.lastname?.toLowerCase() || "";
            const firstname = user.firstname?.toLowerCase() || "";
            return (
                lastname.includes(valueToLowerCase) || firstname.includes(valueToLowerCase)
            )
        }
        );
        setUsersArrayCloned(users)
    }

    function getFormatTime(date: string) {
        if (!date) {
            return ""
        }
        const hour = new Date(date).toISOString().split("T")[1].slice(0, 5)
        return hour;
    }

    async function handleSubmit() {
        try {
            console.log(datas)

            if (datas.usersId.length === 0 || datas.weekDaysId.length === 0 || datas.PlanningsId.length === 0) {
                toast.error("Erreur",
                    "Veuillez sélectionner un collaborateur, son planning ainsi qu'un jour de la semaine"
                );
                return;
            }

            setIsLoading(true);

            const response = await providers.API.update("https://vps118934.serveur-vps.net:4001",
                "updateCollaboratorPlanning",
                null,
                datas,
                null
            );
            console.log(response)
            if (response.status) {
                const resetDatas = {
                    usersId: [],
                    weekDaysId: [],
                    PlanningsId: [],
                    EnterpriseId: null
                }
                setDatas(resetDatas)
                toast.success(response.title,
                    response.message
                )
            }
        } catch (error) {
            toast.error("Erreur", error instanceof Error
                ? error.message : "Erreur inconnue"
            )
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
        setDatas,
        datas,
        getFormatTime
    }
}