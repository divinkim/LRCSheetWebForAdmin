"use client";
import { useState, useEffect } from "react";
import { providers } from "@/index";
import { UserResponseDto, UsersResponseDto, User } from "@/types/global";

export default function useUserProfile() {
    const [user, setUser] = useState<any>();
    const [users, setUsers] = useState<User[]>([])
    useEffect(() => {
        (async () => {
            const userId = window.location.href.split('/').pop();
            const [user, users] = await Promise.all([
                await providers.API.getOne<UserResponseDto>(providers.APIUrl, "users", parseInt(userId ?? "")),
                await providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null),
            ])
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
            });
            setUsers(users.data)
        })()
    }, []);

    return { user, users }
}