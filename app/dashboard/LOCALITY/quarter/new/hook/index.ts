"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { CitiesResponseDto, CountryResponseDto, DistrictResponseDto, QuarterResponseDto } from "@/types/global";
import { useToast } from "@/components/toast";

type InputsValue = {
    name: string;
    CountryId: number | null;
    CityId: number | null;
    DistrictId: number | null;
    Country: {
        name: string;
    };
    City: {
        name: string;
    };
    [key: string]: string | number | null | any;
};

const INITIAL_INPUTS: InputsValue = {
    name: "",
    CountryId: null,
    CityId: null,
    DistrictId: null,
    Country: { name: "" },
    City: { name: "" },
};

export default function useAddQuarter() {
    const { data: session } = useSession();
    const toast = useToast();

    const [inputs, setInputs] = useState<InputsValue>(INITIAL_INPUTS);
    const [getCountry, setCountry] = useState<any[]>([]);
    const [getCity, setCity] = useState<any[]>([]);
    const [getDistrict, setDistrict] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const adminRole = (session?.user as any)?.role ?? null;
    const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId ?? null;

    // 1. Restauration de la mémoire du formulaire depuis localStorage
    useEffect(() => {
        const getInputMemory = localStorage.getItem("inputMemoryOfAddQuarterPage");
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

    // 3. Récupération des villes en fonction du pays sélectionné
    useEffect(() => {
        if (!inputs.CountryId) {
            setCity([]);
            setDistrict([]);
            return;
        }

        (async () => {
            try {
                const getCities = await providers.API.getAll<CitiesResponseDto>(
                    providers.APIUrl,
                    "cities",
                    null
                );
                if (getCities && Array.isArray(getCities.data)) {
                    const filteredCities = getCities.data.filter(
                        (city: any) =>
                            city.CountriesTypeId === Number(inputs.CountryId) ||
                            city.CountryId === Number(inputs.CountryId)
                    );
                    setCity(filteredCities);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des villes :", error);
            }
        })();
    }, [inputs.CountryId]);

    // 4. Récupération des districts en fonction de la ville sélectionnée
    useEffect(() => {
        if (!inputs.CityId) {
            setDistrict([]);
            return;
        }

        (async () => {
            try {
                const getDistricts = await providers.API.getAll<DistrictResponseDto>(
                    providers.APIUrl,
                    "districts",
                    null
                );
                if (getDistricts && Array.isArray(getDistricts.data)) {
                    const filteredDistricts = getDistricts.data.filter(
                        (district: any) => district.CityId === Number(inputs.CityId)
                    );
                    setDistrict(filteredDistricts);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des districts :", error);
            }
        })();
    }, [inputs.CityId]);

    const dynamicArrayData = [
        {
            alias: "CountryId",
            arrayData: getCountry
                .filter((item) => item.id && item.name)
                .map((item) => ({ value: item.id, title: item.name })),
        },
        {
            alias: "CityId",
            arrayData: getCity
                .filter((item) => item.id && item.name)
                .map((item) => ({ value: item.id, title: item.name })),
        },
        {
            alias: "DistrictId",
            arrayData: getDistrict
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

    // 5. Soumission du formulaire
    const handleSubmit = async () => {
        const requiredFields = {
            "Nom du quartier": inputs.name,
            "Pays": inputs.CountryId,
            "Ville": inputs.CityId,
            "District": inputs.DistrictId,
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
                CityId: Number(inputs.CityId),
                DistrictId: Number(inputs.DistrictId),
            };

            await providers.API.post<QuarterResponseDto>(
                providers.APIUrl,
                "quarters",
                null,
                dataToSubmit
            );

            localStorage.removeItem("inputMemoryOfAddQuarterPage");
            toast.success("Succès", "Quartier enregistré avec succès");
            window.location.reload();
        } catch (error) {
            console.error("Erreur lors de l'enregistrement du quartier :", error);
            toast.error(
                "Erreur",
                error instanceof Error ? error.message : "Erreur au niveau du serveur"
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