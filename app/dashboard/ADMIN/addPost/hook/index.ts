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
    DepartmentPost: {
        name: string
    }
    [key: string]: any
}
export default function useAddPost() {
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
            const getInputMemory = localStorage.getItem("inputMemoryOfAddPostPage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory ?? "")) : setInputs({ ...inputs });

            const role = localStorage.getItem("adminRole");
            const enterpriseIdOfAdmin = localStorage.getItem("EnterpriseId");

            const getEnterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);

            if (role !== "Super-Admin") {
                const getEnterprisesByAdminRole = getEnterprises.filter((item: { id: number }) => item.id === Number(enterpriseIdOfAdmin));
                setEnterprises(getEnterprisesByAdminRole)
            } else {
                setEnterprises(getEnterprises);
            }

            setEnterpriseIdOfAdmin(enterpriseIdOfAdmin);
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
            "Départements": inputs.DepartmentPostId,
            "Titre": inputs.EnterpriseId,
            "Description": inputs.DepartmentPostId,
        }

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                return providers.alertMessage(false, "Champs invalides", `Le champs ${key} est obligatoire`, "/dashboard/addUser");
            }
        }

        setIsLoading(true);

        const response = await providers.API.post(providers.APIUrl, "createPoste", null, inputs);

        if (response.status) localStorage.removeItem("inputMemoryOfAddPostPage");

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