"use client";

import { useToast } from "@/components/toast";
import { dateFormat, providers } from "@/index";
import { DepartmentsResponseDto, EnterprisesResponseDto, LeaveDto, LeaveListResponseDto, LeaveTypeListDto, LeaveTypeListsResponseDto, User, UsersResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";


export default function useEditLeave() {
    //  Récupération de la session NextAuth
    const { data: session, status } = useSession();
    const toast = useToast()
    const [users, setUsers] = useState<User[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeListDto[]>([])
    const [adminRole, setAdminRole] = useState<string | null>(null);
    const [leaveId, setLeaveId] = useState(0)
    const [inputs, setInputs] = useState<LeaveDto>({
        LeaveTypeId: 0,
        startDate: "",
        endDate: "",
        reason: "",
        status: "APPROVED",
        rejectedReason: null,
        UserId: 0,
    });

    const [isLoading, setIsLoading] = useState(false);
    const LOCAL_KEY = "inputMemoryOfEditLeave";
    //  Récupération des entreprises et filtrage selon le rôle issu de useSession
    useEffect(() => {
        (async () => {
            const getInputMemory = localStorage.getItem(LOCAL_KEY);
            const leaveId = window.location.href.split("/").pop();
            const AdminRole = (session?.user as any)?.role;
            const EnterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId;

            const leave = (await providers.API.getOne<LeaveListResponseDto>(providers.APIUrl, "leaves", Number(leaveId))).data
            const users = (await providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null)).data;
            const usersByEnterpriseId = users.filter(u => u.Enterprise.MainEnterpriseId === EnterpriseIdOfAdmin);
            const leaveTypes = (await providers.API.getAll<LeaveTypeListsResponseDto>(providers.APIUrl, "leave-types", null)).data;
            const leaveTypesByEnterpriseId = leaveTypes.filter(u => u.Enterprise.MainEnterpriseId === EnterpriseIdOfAdmin);

            setUsers(usersByEnterpriseId);
            setLeaveTypes(leaveTypesByEnterpriseId)
            setInputs({
                ...inputs,
                LeaveTypeId: leave.LeaveTypeId,
                startDate: new Date(leave.startDate).toISOString().split("T")[0],
                endDate: new Date(leave.endDate).toISOString().split("T")[0],
                UserId: leave.UserId,
            })
            if (getInputMemory) {
                setInputs(JSON.parse(getInputMemory));
            }
            setLeaveId(Number(leaveId))
        })();
    }, [session]);
    //  Récupération des départements selon l'entreprise sélectionnée

    const dynamicArrayData = [
        {
            alias: "UserId",
            arrayData: users
                .filter((item) => item.id)
                .map((item) => ({ value: item.id, title: `${item.firstname} ${item.lastname}` })),
        },
        {
            alias: "LeaveTypeId",
            arrayData: leaveTypes
                .filter((item) => item.id)
                .map((item) => ({ value: item.id, title: item.title })),
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
                "Employés": inputs.UserId,
                "Date de début": inputs.startDate,
                "Date de fin": inputs.endDate,
                "Type de congé": inputs.LeaveTypeId,
            };

            for (const [key, value] of Object.entries(requiredFields)) {
                if (!value) {
                    toast.info("Champs invalides", `Le champ ${key} est obligatoire.`);
                    return;
                }
            }

            setIsLoading(true);



            const formattedStart = dateFormat(inputs.startDate);
            const formattedEnd = dateFormat(inputs.endDate);

            await providers.API.update(providers.APIUrl, "leaves", null, inputs, leaveId);

            await providers.API.post(
                providers.APIUrl,
                "notification-push",
                null,
                {
                    senderId: "",
                    receiverId: String(inputs.UserId),
                    messagingType: "leave",
                    title: "Autorisation Congé validé",
                    content: `Vous avez été autorisé par l'administration pour une période de congé, allant du ${formattedStart} au ${formattedEnd}.`
                }
            );

            localStorage.removeItem(LOCAL_KEY);
            toast.success("Succès", "Congé modifié et validé avec succès !");
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