"use client";
import { useState, useEffect } from "react";
import { providers } from "@/index";
import { UserResponseDto } from "@/types/global";

type User = {
    id: number,
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
        id: 0,
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
            const userId = window.location.href.split('/').pop();
            const user = await providers.API.getOne<UserResponseDto>(providers.APIUrl, "users", parseInt(userId ?? ""));
            setUser({
                id: Number(userId),
                firstname: user.data.firstname ?? null,
                lastname: user.data.lastname ?? null,
                birthDate: new Date(user.data.birthDate)?.toISOString()?.split("T")[0] ?? null,
                gender: user.data.gender ?? null,
                email: user.data.email ?? null,
                password: user.data.password ?? null,
                phone: user.data.phone ?? null,
                EnterpriseId: user.data.EnterpriseId ?? null,
                PostId: user.data.PostId ?? null,
                SalaryId: user.data.SalaryId ?? null,
                ContractTypeId: user.data.ContractTypeId ?? null,
                ContractId: user.data.ContractId ?? null,
                CountryId: user.data.CountryId ?? null,
                PlanningId: user.data.PlanningId ?? null,
                CityId: user.data.CityId ?? null,
                DistrictId: user.data.DistrictId ?? null,
                QuarterId: user.data.QuarterId ?? null,
                photo: user.data.photo ?? null,
                role: user.data.role ?? null,
                DepartmentPostId: user.data.DepartmentPostId ?? null,
                marialStatus: user.data.marialStatus ?? null,
                adminService: user.data.adminService ?? null,
                status: user.data.status,
                ContractType: {
                    title: user.data.ContractType?.title ?? "",
                    description: user.data.ContractType?.description ?? ""
                },
                Salary: {
                    netSalary: user.data.Salary?.netSalary ?? "",
                    dailySalary: user.data.Salary?.dailySalary ?? ""
                },
                Enterprise: {
                    name: user.data.Enterprise?.name ?? "",
                    description: user.data.Enterprise?.description ?? "",
                },
                Contract: {
                    endDate: user.data.Contract?.endDate ?? "",
                    startDate: user.data.Contract?.startDate ?? ""
                },

                Country: {
                    name: user.data.Country?.name ?? ""
                },
                City: {
                    name: user.data.City?.name ?? ""
                },
                District: {
                    name: user.data.District?.name ?? ""
                },
                Quarter: {
                    name: user.data.Quarter?.name ?? ""
                },
                Post: {
                    title: user.data.Post?.title ?? "",
                    description: user.data.Post?.description ?? ""
                },
            })
        })()
    }, []);

    return { user }
}