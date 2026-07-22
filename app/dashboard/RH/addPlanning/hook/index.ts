'use client';
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type InputsValue = {
    startTime: string | null,
    breakingStartTime: string | null,
    resumeEndTime: string | null,
    endTime: string | null,
    description: string | null,
    EnterpriseId: number | null,
    [key: string]: string | number | null,
}

export default function useAddPlanning() {
    const [inputs, setInputs] = useState<InputsValue>({
        startTime: null,
        breakingStartTime: null,
        resumeEndTime: null,
        endTime: null,
        description: null,
        EnterpriseId: null,
    });
    const [enterprises, setEnterprises] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    function timeToDate(time: string) {
        const [hours, minutes] = time.split(':').map(Number);

        const date = new Date();
        date.setHours(hours + 1, minutes, 0, 0);

        return date;
    }

    // Récupération des données en mémoires
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddPlanningPage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory)) : setInputs({ ...inputs });
            const enterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
            setEnterprises(enterprises);
        })();
    }, []);

    const handleSubmit = async () => {
        const requireFields = {
            startTime: inputs.startTime,
            endTime: inputs.endTime,
            description: inputs.description,
            EnterpriseId: inputs.EnterpriseId,
        }

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                return providers.alertMessage(false,
                    "Champs invlides",
                    "Veuillez renseigner tous les champs obligatoires",
                    null
                );
            }
        }

        setIsLoading(true);

        const response = await providers.API.post(
            "https://vps118934.serveur-vps.net:4001",
            "createPlanning",
            null,
            {
                startTime: timeToDate(String(inputs.startTime)),
                breakingStartTime: timeToDate(String(inputs.breakingStartTime)),
                resumeEndTime: timeToDate(String(inputs.resumeEndTime)),
                endTime: timeToDate(String(inputs.endTime)),
                description: inputs.description,
                EnterpriseId: inputs.EnterpriseId
            }
        );

        setIsLoading(false);

        if (response.status) localStorage.removeItem("inputMemoryOfAddPlanningPage");

        providers.alertMessage(
            response.status,
            response.title,
            response.message,
            response.status ? "/dashboard/RH/addPlanning" : null
        );

    };

    let dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: enterprises.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },

    ];

    return {
        handleSubmit,
        inputs,
        setInputs,
        isLoading,
        dynamicArrayData
    }
}