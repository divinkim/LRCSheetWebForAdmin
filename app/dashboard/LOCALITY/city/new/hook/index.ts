"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { CitiyResponseDto, CountryResponseDto } from "@/types/global";
import { useToast } from "@/components/toast";

type InputsValue = {
    name: string;
    CountryId: number | null;
    Country: {
        name: string;
    };
    [key: string]: string | number | null | any;
};

const INITIAL_INPUTS: InputsValue = {
    name: "",
    CountryId: null,
    Country: { name: "" },
};

export default function useAddCity() {
    const { data: session } = useSession();
    const toast = useToast();

    const [inputs, setInputs] = useState<InputsValue>(INITIAL_INPUTS);
    const [getCountry, setCountry] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const adminRole = (session?.user as any)?.adminRole ?? null;
    const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId ?? null;

    // 1. Restauration de la mémoire du formulaire depuis localStorage
    useEffect(() => {
        const getInputMemory = localStorage.getItem("inputMemoryOfAddCityPage");
        if (getInputMemory) {
            try {
                setInputs(JSON.parse(getInputMemory));
            } catch (error) {
                console.error("Erreur de lecture du localStorage :", error);
            }
        }
    }, []);

    // 2. Récupération des pays
    useEffect(() => {
        (async () => {
            try {
                const getCountries = await providers.API.getAll<CountryResponseDto>(
                    providers.APIUrl,
                    "countries",
                    null
                );
                if (getCountries && Array.isArray(getCountries.data)) {
                    setCountry(getCountries.data);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des pays :", error);
            }
        })();
    }, []);
console.log(getCountry)
    const dynamicArrayData = [
        {
            alias: "CountryId",
            arrayData: getCountry
                .filter((item) => item.id && item.name)
                .map((item) => ({ value: item.id, title: item.name })),
        },
    ];

    const staticArrayData = [
        {
            alias: "",
            arrayData: [{ title: "", value: "" }],
        },
    ];

    // 3. Soumission du formulaire
    const handleSubmit = async () => {
        const requiredFields = {
            "Nom de la ville": inputs.name,
            "Pays": inputs.CountryId,
        };

        for (const [key, value] of Object.entries(requiredFields)) {
            if (!value) {
                toast.info("Champs invalides", `Le champ ${key} est obligatoire`);
                return;
            }
        }

        setIsLoading(true);

        try {
            const dataToSubmit = {
                name: inputs.name,
                CountryId: Number(inputs.CountryId),
            };

            await providers.API.post<CitiyResponseDto>(
                providers.APIUrl,
                "cities",
                null,
                dataToSubmit
            );

            localStorage.removeItem("inputMemoryOfAddCityPage");
            toast.success("Succès", "La ville a été ajoutée avec succès");
            window.location.reload();
        } catch (error) {
            console.error("Erreur lors de l'ajout de la ville :", error);
            toast.error(
                "Erreur",
                error instanceof Error ? error.message : "Une erreur est survenue sur le serveur"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return {
        dynamicArrayData,
        staticArrayData,
        handleSubmit,
        inputs,
        setInputs,
        isLoading,
        adminRole,
    };
}