"use client";
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type InputsValue = {
    title: string | null,
    description: string | null
    EnterpriseId: number | null,
    DepartmentPostId: number | null,
    Enterprise: {
        name: string
    },
    [key: string]: any
}
export default function useAddDepartment() {
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

    const [enterpriseIdOfadmin, setEnterpriseIdOfAdmin] = useState<string | null>(null)
    const [adminRole, setAdminRole] = useState<string | null>(null)
    const [inputs, setInputs] = useState<InputsValue>({
        EnterpriseId: null,
        DepartmentPostId: null,
        description: null,
        title: null,
        Enterprise: {
            name: ""
        },
        DepartmentPost: {
            name: ""
        }
    });

    const [isLoading, setIsLoading] = useState(false);

    // Récupération des entreprises et filtrage en fonction de l'id de l'administrateur courant
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddDepartmentPage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory ?? "")) : setInputs({ ...inputs });

            const role = localStorage.getItem("adminRole");
            const enterpriseIdOfAdmin = localStorage.getItem("EnterpriseId");

            const getEnterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);

            if (adminRole !== "Super-Admin") {
                const getEnterprisesByAdminRole = getEnterprises.filter((item: { id: number }) => item.id === Number(enterpriseIdOfAdmin));
                setEnterprises(getEnterprisesByAdminRole)
            } else {
                setEnterprises(getEnterprises);
            }

            setEnterpriseIdOfAdmin(enterpriseIdOfAdmin);
            setAdminRole(role);
        })();
    }, []);

    // const adminRoles = ['Super-Admin', 'Supervisor-Admin'];
    // const role = window?.localStorage.getItem("adminRole") ?? "";

    let dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: getEnterprises.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
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

        const requireFields = {
            "Entreprises": inputs.EnterpriseId,
            "Titre": inputs.EnterpriseId,
            "Description": inputs.description
        }

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                return providers.alertMessage(false, "Champs invalides", `Le champs ${key} est obligatoire`, "/dashboard/addUser");
            }
        }

        setIsLoading(true);

        const response = await providers.API.post(providers.APIUrl, "createDepartmentPost", null, inputs);

        if (response.status) localStorage.removeItem("inputMemoryOfAddDepartmentPage");

        providers.alertMessage(
            response.status,
            response.title,
            response.message,
            response.status ? "/dashboard/ADMIN/addDepartment" : null
        );

        setIsLoading(false);
    };

    console.log("les datas", inputs);

    return { dynamicArrayData, staticArrayData, handleSubmit, inputs, setInputs, isLoading, adminRole }
}