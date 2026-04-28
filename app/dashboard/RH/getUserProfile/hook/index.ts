"use client";
import { useState, useEffect } from "react";
import { providers } from "@/index";

type User = {
    firstname: string | null,
    lastname: string | null,
    birthDate: string | null,
    gender: string | null,
    email: string | null,
    password: string | null,
    phone: string | null,
    EnterpriseId: number | null,
    PostId: number | null,
    SalaryId: number | null,
    ContractTypeId: number | null,
    ContractType: {
        title: string,
        description: string
    },
    Salary: {
        netSalary: string,
        dailySalary: string
    },
    Enterprise: {
        name: string,
        description: string,
    },
    Contract: {
        endDate: string,
        startDate: string
    },

    Country: {
        name: string
    },
    Post: {
        title: string,
        description: string,
    },
    City: {
        name: string
    },
    District: {
        name: string
    },
    Quarter: {
        name: string
    },
    ContractId: number | null,
    CountryId: number | null,
    CityId: number | null,
    PlanningId: number | null,
    DistrictId: number | null,
    QuarterId: number | null,
    photo: string | null,
    role: string | null,
    DepartmentPostId: number | null,
    marialStatus: string | null,
    adminService: string | null,
    status: boolean | null,
    [key: string]: string | number | null | undefined | any,
}

export default function useUserProfile() {
    const [user, setUser] = useState<User>({
        firstname: null,
        lastname: null,
        birthDate: null,
        gender: null,
        email: null,
        password: null,
        phone: null,
        EnterpriseId: null,
        PostId: null,
        SalaryId: null,
        ContractTypeId: null,
        ContractId: null,
        CountryId: null,
        CityId: null,
        DistrictId: null,
        PlanningId: null,
        QuarterId: null,
        photo: null,
        role: null,
        DepartmentPostId: null,
        marialStatus: null,
        adminService: null,
        Post: {
            title: "",
            description: ""
        },
        status: null,
        ContractType: {
            title: "",
            description: ""
        },
        Salary: {
            netSalary: "",
            dailySalary: ""
        },
        Enterprise: {
            name: "",
            description: "",
        },
        Contract: {
            endDate: "",
            startDate: ""
        },

        Country: {
            name: ""
        },
        City: {
            name: ""
        },
        District: {
            name: ""
        },
        Quarter: {
            name: ""
        },
    });

    useEffect(() => {
        (async () => {
            const getUserId = window.location.href.split('/').pop();
            const getUser = await providers.API.getOne(providers.APIUrl, "getUser", parseInt(getUserId ?? ""));
            console.log("l'utilisateur", getUser);
            setUser({
                firstname: getUser.firstname ?? null,
                lastname: getUser.lastname ?? null,
                birthDate: new Date(getUser.birthDate)?.toISOString()?.split("T")[0] ?? null,
                gender: getUser.gender ?? null,
                email: getUser.email ?? null,
                password: getUser.password ?? null,
                phone: getUser.phone ?? null,
                EnterpriseId: getUser.EnterpriseId ?? null,
                PostId: getUser.PostId ?? null,
                SalaryId: getUser.SalaryId ?? null,
                ContractTypeId: getUser.ContractTypeId ?? null,
                ContractId: getUser.ContractId ?? null,
                CountryId: getUser.CountryId ?? null,
                PlanningId: getUser.PlanningId ?? null,
                CityId: getUser.CityId ?? null,
                DistrictId: getUser.DistrictId ?? null,
                QuarterId: getUser.QuarterId ?? null,
                photo: getUser.photo ?? null,
                role: getUser.role ?? null,
                DepartmentPostId: getUser.DepartmentPostId ?? null,
                marialStatus: getUser.marialStatus ?? null,
                adminService: getUser.adminService ?? null,
                status: getUser.status,
                ContractType: {
                    title: getUser.ContractType?.title ?? "",
                    description: getUser.ContractType?.description ?? ""
                },
                Salary: {
                    netSalary: getUser.Salary?.netSalary ?? "",
                    dailySalary: getUser.Salary?.dailySalary ?? ""
                },
                Enterprise: {
                    name: getUser.Enterprise?.name ?? "",
                    description: getUser.Enterprise?.description ?? "",
                },
                Contract: {
                    endDate: getUser.Contract?.endDate ?? "",
                    startDate: getUser.Contract?.startDate ?? ""
                },

                Country: {
                    name: getUser.Country?.name ?? ""
                },
                City: {
                    name: getUser.City?.name ?? ""
                },
                District: {
                    name: getUser.District?.name ?? ""
                },
                Quarter: {
                    name: getUser.Quarter?.name ?? ""
                },
                Post: {
                    title: getUser.Post?.title ?? "",
                    description: getUser.Post?.description ?? ""
                },
            })
        })()
    }, []);

    return { user }
}