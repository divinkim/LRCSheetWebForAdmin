"use client";
import { providers } from "@/index";
import { FormEvent, useEffect, useState } from "react";

type InputsValue = {
    grossSalary: string | null,
    dailySalary: string | null,
    netSalary: string | null,
    EnterpriseId: number | null
    PostId: number | null,
    Post: {
        title: string
    },
    Enterprise: {
        name: string
    },
    [key: string]: string | number | null | any
}
export default function useAddSalary() {
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
        grossSalary: null,
        dailySalary: null,
        netSalary: null,
        EnterpriseId: null,
        PostId: null,
        Post: {
            title: ""
        },
        Enterprise: {
            name: ""
        }
    });

    const [isLoading, setIsLoading] = useState(false);

    // Récupération des entreprises et filtrage en fonction de l'id de l'administrateur courant
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem("inputMemoryOfAddSalaryPage");
            getInputMemory ? setInputs(JSON.parse(getInputMemory ?? "")) : setInputs({ ...inputs });

            const role = localStorage.getItem("adminRole");
            const enterpriseIdOfAdmin = localStorage.getItem("EnterpriseId");
            console.log("Le role de l'admin", role)
            console.log("enterpriseId", enterpriseIdOfAdmin)
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
            const getPosts = await providers.API.getAll(providers.APIUrl, "getPosts", null);
            const filterDepartmentsByAdminEnterpriseId = getPosts.filter((post: { EnterpriseId: number }) => post.EnterpriseId === inputs.EnterpriseId);
            setPosts(filterDepartmentsByAdminEnterpriseId)
        })()
    }, [inputs.EnterpriseId]);

    // const adminRoles = ['Super-Admin', 'Supervisor-Admin'];
    // const role = window?.localStorage.getItem("adminRole") ?? "";
    console.log("les posts", getPosts)
    let dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: getEnterprises.filter(item => item.id && item.name).map(item => ({ value: item.id, title: item.name }))
        },
        {
            alias: "PostId",
            arrayData: getPosts.filter(item => item.id && item.title).map(item => ({ value: item.id, title: item.title }))
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
            grossSalary: inputs.grossSalary,
            dailySalary: inputs.dailySalary,
            EnterpriseId: inputs.EnterpriseId,
            PostId: inputs.PostId,
        }

        for (const [key, value] of Object.entries(requireFields)) {
            if (!value) {
                return providers.alertMessage(false, "Champs invalides", `Veuillez remplir tous les champs obligatoires`, null);
            }
        }

        setIsLoading(true);

        const response = await providers.API.post(providers.APIUrl, "addSalary", null, {
            ...inputs,
            netSalary: inputs.grossSalary
        });

        if (response.status) localStorage.removeItem("inputMemoryOfAddSalaryPage");

        providers.alertMessage(
            response.status,
            response.title,
            response.message,
            response.status ? "/dashboard/COMPTA/addSalary" : null
        );

        setIsLoading(false);
    };

    console.log("les datas", inputs);

    return { dynamicArrayData, staticArrayData, handleSubmit, inputs, setInputs, isLoading, adminRole }
}