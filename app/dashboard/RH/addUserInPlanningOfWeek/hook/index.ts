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
    PlanningId: number
}
import { useState, useEffect } from "react";
import { providers } from "@/index";
import AddOrEditUserPlanningOfWeek from "@/components/addEditUserPlanningOfWeek";

export default function useAddUserInPlanningOfWeek() {
    const [usersArray, setUsersArray] = useState<Users[]>([]);
    const [usersArrayCloned, setUsersArrayCloned] = useState<Users[]>([]);
    const { users, addEditUserPlanningOfWeek, weekDays, plannings } = AddOrEditUserPlanningOfWeek();
    const [isLoading, setIsLoading] = useState(false);
    const [datas, setDatas] = useState<Datas>({
        usersId: [],
        weekDaysId: [],
        PlanningId: 0,
    });

    useEffect(() => {
        (() => {
            setUsersArray(users);
            setUsersArrayCloned(users);
        })();
    }, [users]);

    function onSearch(value: string) {
        const findUser = usersArray.filter(user => user.lastname?.toLowerCase().includes(value?.toLowerCase()) || user.firstname?.toLowerCase()?.includes(value?.toLocaleLowerCase()));
        setUsersArrayCloned(findUser)
    }

    async function handleSubmit() {
        setIsLoading(true);

        if (datas.usersId.length <= 0 || datas.weekDaysId.length <= 0 || datas.PlanningId === 0) {
            return setTimeout(() => {
                providers.alertMessage(false, "Champs incorrectes", "Veuillez sélectionner au moins un utilisateur, un jour de la semaine y compris un planning", null);
                setIsLoading(false)
            }, 1000)
        }
        const response = await providers.API.post(providers.APIUrl, "joinUsersInPlanning", null, datas);
        providers.alertMessage(response.status, response.title, response.message, response.status ? "/dashboard/RH/addUserInPlanningOfWeek" : null);
        setIsLoading(false);
    }

    return { handleSubmit, onSearch, usersArrayCloned, addEditUserPlanningOfWeek, weekDays, plannings, isLoading, setDatas, datas }
}