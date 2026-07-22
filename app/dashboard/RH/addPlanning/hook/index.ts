'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/hooks/useToast";

type InputsValue = {
    startTime: string | null;
    breakingStartTime: string | null;
    resumeEndTime: string | null;
    endTime: string | null;
    description: string | null;
    EnterpriseId: number | null;
    [key: string]: string | number | null;
};

export default function useAddPlanning() {
    const { data: session, status } = useSession();
    const toast = useToast();

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

    // Helper pour convertir une chaîne "HH:mm" en objet Date
    function timeToDate(time: string | null) {
        if (!time) return null;
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return null;

        const date = new Date();
        date.setHours(hours + 1, minutes, 0, 0);
        return date;
    }

    // Initialisation et récupération des données
    useEffect(() => {
        async function initData() {
            if (status !== "authenticated" || !session?.user) return;

            try {
                // 1. Récupération de la mémoire locale
                const getInputMemory = localStorage.getItem("inputMemoryOfAddPlanningPage");
                if (getInputMemory) {
                    try {
                        setInputs(JSON.parse(getInputMemory));
                    } catch {
                        // Si le JSON local est corrompu
                    }
                }

                // 2. Récupération des entreprises depuis l'API
                const data = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
                const enterpriseList = data || [];
                setEnterprises(enterpriseList);

                // 3. Pré-remplissage de l'entreprise si l'utilisateur n'est pas Super-Admin (EnterpriseId !== 1)
                const userEnterpriseId = session.user.EnterpriseId;
                if (userEnterpriseId && userEnterpriseId !== 1) {
                    setInputs((prev) => ({
                        ...prev,
                        EnterpriseId: userEnterpriseId,
                    }));
                }
            } catch (error) {
                toast.error("Erreur lors du chargement des entreprises");
                console.error("Erreur initData Hook:", error);
            }
        }

        initData();
    }, [session, status]);

    // Soumission du formulaire
    const handleSubmit = async () => {
        // Validation des champs obligatoires
        const requireFields = {
            startTime: inputs.startTime,
            endTime: inputs.endTime,
            description: inputs.description,
            EnterpriseId: inputs.EnterpriseId,
        };

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                toast.error("Veuillez renseigner tous les champs obligatoires (*)");
                return;
            }
        }

        try {
            setIsLoading(true);

            const payload = {
                startTime: timeToDate(inputs.startTime),
                breakingStartTime: inputs.breakingStartTime ? timeToDate(inputs.breakingStartTime) : null,
                resumeEndTime: inputs.resumeEndTime ? timeToDate(inputs.resumeEndTime) : null,
                endTime: timeToDate(inputs.endTime),
                description: inputs.description,
                EnterpriseId: inputs.EnterpriseId ? Number(inputs.EnterpriseId) : null,
            };

            const response = await providers.API.post(
                providers.APIUrl,
                "createPlanning",
                null,
                payload
            );

            if (response.status) {
                toast.success("Bravo",|| "Planning créé avec succès !");

                // Nettoyage de la mémoire et réinitialisation du formulaire
                localStorage.removeItem("inputMemoryOfAddPlanningPage");
                setInputs({
                    startTime: null,
                    breakingStartTime: null,
                    resumeEndTime: null,
                    endTime: null,
                    description: null,
                    EnterpriseId: session?.user?.EnterpriseId !== 1 ? session?.user?.EnterpriseId : null,
                });
            } else {
                toast.error("Erreur", "Échec de la création du planning");
            }
        } catch (error) {
            toast.error("Erreur", "Une erreur réseau s'est produite lors de la soumission.");
            console.error("Erreur handleSubmit Planning:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Tableau dynamique pour alimenter le Select dans le formulaire
    const dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: enterprises
                .filter((item) => item.id && item.name)
                .map((item) => ({
                    value: item.id,
                    title: item.name,
                })),
        },
    ];

    return {
        handleSubmit,
        inputs,
        setInputs,
        isLoading,
        dynamicArrayData,
    };
}