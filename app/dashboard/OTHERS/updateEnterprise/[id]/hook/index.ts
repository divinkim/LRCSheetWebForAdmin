"use client";
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type InputsValue = {
    name: string,
    description: string,
    logo: string,
    activityDomain: string,
    phone: string,
    toleranceTime: string | null,
    maxToleranceTime: string | null,
    pourcentageOfHourlyDeduction: string | null,
    maxPourcentageOfHourlyDeduction: string | null,
    email: string,
    address: string,
    website: string | null,
    latitude: string,
    longitude: string,
    CityId: number | null,
    City: {
        name: string
    }
    CountryId: number | null,
    Country: {
        name: string
    },
    legalForm: string,
    rccm: string | null,
    nui: string | null,
    subscriptionType: string,
    subscriptionStatus: string,
    [key: string]: any
}
export default function useUpdateEnterprise() {
    const [getEnterprises, setEnterprises] = useState<any[]>([]);
    const [getDepartmentPosts, setDepartmentPosts] = useState<any[]>([]);
    const [getPosts, setPosts] = useState<any[]>([]);
    const [getSalary, setSalary] = useState<any[]>([]);
    const [getContractTypes, setContractTypes] = useState<any[]>([]);
    const [getContracts, setContracts] = useState<any[]>([]);
    const [getCountry, setCountry] = useState<any[]>([]);
    const [getCity, setCity] = useState<any[]>([]);
    const [getDistrict, setDistrict] = useState<any[]>([]);
    const [getQuarter, setQuarter] = useState<any[]>([]);
    const [getPlannings, setPlannings] = useState<any[]>([])

    const [EnterpriseId, setEnterpriseId] = useState<string | null>(null)
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [inputs, setInputs] = useState<InputsValue>({
        name: "",
        description: "",
        logo: "",
        activityDomain: "",
        phone: "",
        toleranceTime: null,
        maxToleranceTime: null,
        pourcentageOfHourlyDeduction: null,
        maxPourcentageOfHourlyDeduction: null,
        email: "",
        address: "",
        website: null,
        latitude: "",
        longitude: "",
        CityId: null,
        City: {
            name: ""
        },
        CountryId: null,
        Country: {
            name: ""
        },
        legalForm: "",
        rccm: null,
        nui: null,
        subscriptionType: "",
        subscriptionStatus: "",
    });

    const [isLoading, setIsLoading] = useState(false);

    // Récupération des entreprises et filtrage en fonction de l'id de l'administrateur courant
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddEnterprisePage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory ?? "")) : setInputs({ ...inputs });

            const role = localStorage.getItem("adminRole");
            const enterpriseIdOfAdmin = window.location.href.split('/').pop();

            const getEnterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);

            const getEnterprise = getEnterprises.filter((item: { id: number }) => item.id === Number(enterpriseIdOfAdmin))[0];
            console.log("les données reçu",getEnterprise)
            setInputs({
                name: getEnterprise.name,
                description: getEnterprise.description,
                logo: getEnterprise.logo,
                activityDomain: getEnterprise.activityDomain,
                phone: getEnterprise.phone,
                toleranceTime: getEnterprise.toleranceTime,
                maxToleranceTime: getEnterprise.maxToleranceTime,
                pourcentageOfHourlyDeduction: getEnterprise.pourcentageOfHourlyDeduction,
                maxPourcentageOfHourlyDeduction: getEnterprise.maxPourcentageOfHourlyDeduction,
                email: getEnterprise.email,
                address: getEnterprise.address,
                website: getEnterprise.website,
                latitude: getEnterprise.latitude,
                longitude: getEnterprise.longitude,
                CityId: getEnterprise.CityId,
                City: {
                    name: getEnterprise.City.name
                },
                CountryId: getEnterprise.Country,
                Country: {
                    name: getEnterprise.Country.name
                },
                legalForm: getEnterprise.legalForm,
                rccm: getEnterprise.rccm,
                nui: getEnterprise.niu,
                subscriptionType: getEnterprise.subscriptionType,
                subscriptionStatus: getEnterprise.subscriptionStatus,
            })
            setEnterpriseId(String(enterpriseIdOfAdmin));
            setAdminRole(role);
        })();
    }, []);

    // Récupération des départements d'entreprises
    useEffect(() => {
        (async () => {
            const getDepartmentPosts = await providers.API.getAll(providers.APIUrl, "getDepartmentPosts", null);
            const filterDepartmentsByAdminEnterpriseId = getDepartmentPosts.filter((department: { EnterpriseId: number }) => department.EnterpriseId === inputs.EnterpriseId);
            setDepartmentPosts(filterDepartmentsByAdminEnterpriseId)
        })()
    }, [inputs.EnterpriseId]);

    useEffect(() => {
        (async () => {
            setTimeout(async () => {
                const getCountries = await providers.API.getAll(providers.APIUrl, "getCountries", null);
                setCountry(getCountries);
                console.log(getCountries)
            }, 2000)
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

    // const adminRoles = ['Super-Admin', 'Supervisor-Admin'];
    // const role = window?.localStorage.getItem("adminRole") ?? "";

    let dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: getEnterprises.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "DepartmentPostId",
            arrayData: getDepartmentPosts.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "CountryId",
            arrayData: getCountry.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "CityId",
            arrayData: getCity.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
    ];

    let staticArrayData = [
        {
            alias: "subscriptionStatus",
            arrayData: [
                {
                    title: "En cours",
                    value: "onGoing",
                },
                {
                    title: "Expiré",
                    value: "expired",
                },

            ]

        },
    ]

    console.log("le tableau des données statiques", dynamicArrayData)

    const handleSubmit = async () => {

        const requireFields = {
            name: inputs.name,
            description: inputs.description,
            logo: inputs.logo,
            activityDomain: inputs.activityDomain,
            phone: inputs.phone,
            CityId: inputs.CityId,
            CountryId: inputs.CountryId,
            latitude: inputs.latitude,
            longitude: inputs.longitude,
        }

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                return providers.alertMessage(false, "Champs invalides", `Veuillez remplir tous les champs  obligatoires`, null);
            }
        }

        setIsLoading(true);

        const response = await providers.API.update(providers.APIUrl, "updateEnterprise", null, inputs, Number(EnterpriseId));

        if (response.status) localStorage.removeItem("inputMemoryOfAddEnterprisePage");

        providers.alertMessage(
            response.status,
            response.title,
            response.message,
            response.status ? "/dashboard/ADMIN/addPost" : null
        );

        setIsLoading(false);
    };

    console.log("les datas", inputs);

    return { dynamicArrayData, staticArrayData, handleSubmit, inputs, setInputs, isLoading, adminRole }
}