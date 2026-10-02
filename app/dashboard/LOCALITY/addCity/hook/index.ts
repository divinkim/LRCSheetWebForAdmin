"use client";
import { providers } from "@/index";
import { CitiyResponseDto, CountryResponseDto } from "@/types/global";
import { FormEvent, useEffect, useState } from "react";
import { useToast } from "@/components/toast";
type InputsValue = {
    name: string,
    CountryId: number | null,
    Country: {
        name: string
    },
    [key: string]: string | number | null | any
}
export default function useAddCity() {
    const [getEnterprises, setEnterprises] = useState<any[]>([]);
    const [getPosts, setPosts] = useState<any[]>([]);
    const [getSalary, setSalary] = useState<any[]>([]);
    const [getContractTypes, setContractTypes] = useState<any[]>([]);
    const [getContracts, setContracts] = useState<any[]>([]);
    const [getCountry, setCountry] = useState<any[]>([]);
    const [getCity, setCity] = useState<any[]>([]);
    const [getDistrict, setDistrict] = useState<any[]>([]);
    const [getQuarter, setQuarter] = useState<any[]>([]);
    const [getPlannings, setPlannings] = useState<any[]>([])
    const toast = useToast()
    const [enterpriseIdOfadmin, setEnterpriseIdOfAdmin] = useState<string | null>(null)
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [inputs, setInputs] = useState<InputsValue>({
        name: "",
        CountryId: null,
        Country: {
            name: ""
        },
    });

    const [isLoading, setIsLoading] = useState(false);

    // Récupération des entreprises et filtrage en fonction de l'id de l'administrateur courant
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddCityPage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory ?? "")) : setInputs({ ...inputs });

            const role = localStorage.getItem("adminRole");
            const enterpriseIdOfAdmin = localStorage.getItem("EnterpriseId");
            console.log("Le role de l'admin", role)
            console.log("enterpriseId", enterpriseIdOfAdmin)
            // const getEnterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);

            // if (role !== "Super-Admin") {
            //     const getEnterprisesByAdminRole = getEnterprises.filter((item: { id: number }) => item.id === Number(enterpriseIdOfAdmin));
            //     setEnterprises(getEnterprisesByAdminRole)
            // } else {
            //     setEnterprises(getEnterprises);
            // }

            setEnterpriseIdOfAdmin(enterpriseIdOfAdmin);
            setAdminRole(role);
        })();
    }, []);

    // // Récupération des type des pays
    useEffect(() => {
        (async () => {
            const getCountries = await providers.API.getAll<CountryResponseDto>(providers.APIUrl, "countries", null);
            setCountry(getCountries.data);
        })();
    }, []);

    // // Récupération des type des villes en fonction du pays
    // useEffect(() => {
    //     (async () => {
    //         const getCities = await providers.API.getAll(providers.APIUrl, "getCities", null);
    //         const filteredCities = getCities.filter((city: any) => city.CountriesTypeId === inputs.CountryId)
    //         setCity(filteredCities)
    //     })()
    // }, [inputs.CountryId]);

    // const adminRoles = ['Super-Admin', 'Supervisor-Admin'];
    // const role = window?.localStorage.getItem("adminRole") ?? "";
    let dynamicArrayData = [
        {
            alias: "CountryId",
            arrayData: getCountry.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        // {
        //     alias: "CityId",
        //     arrayData: getCity.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        // },
    ];

    let staticArrayData = [
        {
            alias: "",
            arrayData: [{
                title: "",
                value: "",
            }]

        }
    ]

    const handleSubmit = async () => {
        const data = {
            name: inputs.name,
            CityId: inputs.CityId,
            CountryId: inputs.CountryId,
        };

        // Validation des champs requis
        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                toast.info("Champs invalides", "Veuillez remplir tous les champs obligatoires");
                return;
            }
        }

        setIsLoading(true);

        try {
            await providers.API.post<CitiyResponseDto>(
                providers.APIUrl,
                "cities",
                null,
                data
            );

            localStorage.removeItem("inputMemoryOfAddCityPage");
            toast.success("Succès", "La ville a été ajoutée avec succès");
        } catch (error) {
            console.error("Erreur lors de l'ajout de la ville:", error);
            toast.error(
                "Erreur",
                error instanceof Error ? error.message : "Une erreur est survenue sur le serveur"
            );
        } finally {
            setIsLoading(false);
        }
    };


    return { dynamicArrayData, staticArrayData, handleSubmit, inputs, setInputs, isLoading, adminRole }
}