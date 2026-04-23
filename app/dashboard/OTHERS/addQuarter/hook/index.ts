"use client";
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type InputsValue = {
    name: string,
    CountryId: number | null,
    CityId: number | null,
    DistrictId: number | null,
    Country: {
        name: string
    },
    City: {
        name: string
    }
    [key: string]: string | number | null | any
}
export default function useAddQuarter() {
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

    const [enterpriseIdOfadmin, setEnterpriseIdOfAdmin] = useState<string | null>(null)
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [inputs, setInputs] = useState<InputsValue>({
        name: "",
        CountryId: null,
        DistrictId: null,
        CityId: null,
        Country: {
            name: ""
        },
        City: {
            name: ""
        }
    });

    const [isLoading, setIsLoading] = useState(false);

    // Récupération des entreprises et filtrage en fonction de l'id de l'administrateur courant
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddQuarterPage");
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
            const getCountries = await providers.API.getAll(providers.APIUrl, "getCountries", null);
            setCountry(getCountries);
            console.log(getCountries)
        })();
    }, []);

    // // Récupération des type des villes en fonction du pays
    useEffect(() => {
        (async () => {
            const getCities = await providers.API.getAll(providers.APIUrl, "getCities", null);
            const filteredCities = getCities.filter((city: any) => city.CountriesTypeId === inputs.CountryId)
            setCity(filteredCities)
        })()
    }, [inputs.CountryId]);

    useEffect(() => {
        (async () => {
            const getDistricts = await providers.API.getAll(providers.APIUrl, "getDistricts", null);
            const filteredDistricts = getDistricts.filter((district: any) => district.CityId === inputs.CityId)
            setTimeout(() => {
                setDistrict(filteredDistricts)
            }, 2000)
            console.log(filteredDistricts);
        })()
    }, [inputs.CityId]);

    // const adminRoles = ['Super-Admin', 'Supervisor-Admin'];
    // const role = window?.localStorage.getItem("adminRole") ?? "";
    let dynamicArrayData = [
        {
            alias: "CountryId",
            arrayData: getCountry.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "CityId",
            arrayData: getCity.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "DistrictId",
            arrayData: getDistrict.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
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

    console.log("le tableau des données statiques", dynamicArrayData)

    const handleSubmit = async () => {
        const data = {
            name: inputs.name,
            CityId: inputs.CityId,
            CountryId: inputs.CountryId
        }
        for (const [key, value] of Object.entries(data)) {
            if (!value) {
                return providers.alertMessage(false, "Champs invalides", `Veuillez remplir tous les champs obligatoires`, null);
            }
        }

        setIsLoading(true);

        const response = await providers.API.post(providers.APIUrl, "createQuarter", null, data);

        if (response.status) localStorage.removeItem("inputMemoryOfAddQuarterPage");

        providers.alertMessage(
            response.status,
            response.title,
            response.message,
            response.status ? "/dashboard/OTHERS/addQuarter" : null
        );

        setIsLoading(false);
    };

    console.log("les datas", inputs);

    return { dynamicArrayData, staticArrayData, handleSubmit, inputs, setInputs, isLoading, adminRole }
}