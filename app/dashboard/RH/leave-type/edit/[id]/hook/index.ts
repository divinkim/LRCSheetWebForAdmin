"use client";

import { useToast } from "@/components/toast";
import { dateFormat, providers } from "@/index";
import { DepartmentsResponseDto, Enterprise, EnterprisesResponseDto, LeaveDto, LeaveListResponseDto, LeaveTypeDto, LeaveTypeListDto, LeaveTypeListResponseDto, LeaveTypeListsResponseDto, User, UsersResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";


export default function useEditLeaveType() {
    //  Récupération de la session NextAuth
    const { data: session, status } = useSession();
    const toast = useToast()
    const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
    const [adminRole, setAdminRole] = useState<string | null>(null);
    const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
    const [inputs, setInputs] = useState<LeaveTypeDto>({
        title: "",
        description: "",
        EnterpriseId: 0,
    });

    const [isLoading, setIsLoading] = useState(false);
    const LOCAL_KEY = "inputMemoryOfEditLeaveType";

    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem(LOCAL_KEY);
            if (getInputMemory) {
                setInputs(JSON.parse(getInputMemory));
            }
            const leaveTypeId = window.location.href.split("/").pop();
            const leaveType = (await providers.API.getOne<LeaveTypeListResponseDto>(providers.APIUrl, "leave-types", Number(leaveTypeId))).data;
            const AdminRole = (session?.user as any)?.role;
            const EnterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId;
            const enterprises = (await providers.API.getAll<EnterprisesResponseDto>(providers.APIUrl, "enterprises", null)).data;
            const enterprisesByAdminId = enterprises.filter(u => u.MainEnterpriseId === EnterpriseIdOfAdmin);
            setEnterprises(enterprisesByAdminId)
            setInputs({
                title: leaveType.title,
                description: leaveType.description,
                EnterpriseId: leaveType.EnterpriseId,
            });
            setLeaveTypeId(Number(leaveTypeId))
        })();
    }, [session]);
    //  Récupération des départements selon l'entreprise sélectionnée

    const dynamicArrayData = [
        {
            alias: "EnterpriseId",
            arrayData: enterprises
                .filter((item) => item.id)
                .map((item) => ({ value: item.id, title: item.name })),
        },
    ];

    const staticArrayData = [
        {
            alias: "",
            arrayData: [
                {
                    title: "",
                    value: "",
                },
            ],
        },
    ];

    const handleSubmit = async () => {
        if (!inputs) return
        try {
            const requiredFields = {
                "Entreprises": inputs.EnterpriseId,
                "Titre": inputs.title,
                "Description": inputs.description,
            };

            for (const [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    toast.info("Champs invalides", `Le champ ${key} est obligatoire.`);
                    return;
                }
            }

            setIsLoading(true);

            await providers.API.update(providers.APIUrl, "leave-types", null, inputs, Number(leaveTypeId));

            localStorage.removeItem(LOCAL_KEY);
            toast.success("Succès", "Type de congé enregistré et validé avec succès !");

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error: any) {
            console.error("Erreur lors de la validation du congé :", error);
            toast.error("Erreur", error?.message || "Une erreur est survenue lors de l'opération.");
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
        LOCAL_KEY
    };
}