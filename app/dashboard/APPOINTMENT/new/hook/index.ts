'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { AppointmentDto } from "@/types/appointment";
export function useAppointment() {
    const { data: session, status: sessionStatus } = useSession();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    type Fields = {
        fullName: string,
        phone: string,
        UserId: number | null,
        date: string,
        reason: string,
        [key: string]: string | number | any
    }
    const [requireFields, setRequireFields] = useState<Fields>({
        fullName: "",
        phone: "",
        UserId: null,
        date: "",
        reason: "",

    })
    // Informations issues de la session NextAuth
    const adminRole = (session?.user as any)?.role ?? null;
    const sessionEnterpriseId = (session?.user as any)?.EnterpriseId
        ? Number((session?.user as any).EnterpriseId)
        : null;

    // Listes dynamiques depuis l'API
    const [users, setUsers] = useState<any[]>([]);
    const [inputs, setInputs] = useState<AppointmentDto>({
        fullName: "",
        email: null,
        phone: "",
        UserId: null,
        date: "",
        time: null,
        status: "PEDDING",
        reason: ""
    })
    useEffect(() => {
        if (sessionStatus === "loading") return;

        (async () => {
            // Restauration de la mémoire du formulaire si présente
            const getInputMemory = localStorage.getItem("inputMemoryOfAddAppointmentPage");
            if (getInputMemory) {
                setInputs(JSON.parse(getInputMemory));
            }
            try {
                const users = await providers.API.getAll(providers.APIUrl, "getUsers", null);
                console.log(users)
                setUsers(users);
            } catch (error) {
                console.error("Erreur lors de l'initialisation :", error);
            }
        })();
    }, [sessionStatus, sessionEnterpriseId, adminRole]);


    // Listes dynamiques pour les sélecteurs
    const dynamicArrayData = [
        {
            alias: "UserId",
            arrayData: users.filter((item) => item.id
                && item.firstname
                && item.lastname
                && [1, 2, 3, 4].includes(Number(sessionEnterpriseId)))
                .map((item) => ({
                    value: item.id,
                    title: `${item.firstname} ${item.lastname}`
                })),
        },

    ];

    // Listes statiques
    const staticArrayData = [
        {
            alias: "gender",
            arrayData: [
                { title: "Homme", value: "Homme" },
                { title: "Femme", value: "Femme" },
                { title: "Aucun", value: "Aucun" },
            ],
        },
        {
            alias: "status",
            arrayData: [
                { title: "Actif", value: "Actif" },
                { title: "Inactif", value: "Inactif" },
            ],
        },
        {
            alias: "role",
            arrayData: [
                { title: "Super administrateur", value: "Super-Admin" },
                { title: "Administrateur général", value: "Supervisor-Admin" },
                { title: "Administrateur de contrôle", value: "Controllor-Admin" },
                { title: "Utilisateur client", value: "client" },
            ],
        },
        {
            alias: "adminService",
            arrayData: [
                { title: "Administration", value: "ADMINISTRATION" },
                { title: "Ressources humaines", value: "RH" },
                { title: "Comptabilité", value: "COMPTA" },
            ],
        },
        {
            alias: "marialStatus",
            arrayData: [
                { title: "Célibataire", value: "Célibataire" },
                { title: "Fiancé(e)", value: "Fiancé" },
                { title: "En couple", value: "En couple" },
                { title: "Divorcé(e)", value: "Divorcé(e)" },
            ],
        },
    ];

    // Soumission
    const handleSubmit = async () => {
        try {

            let fields = {
                fullName: inputs.fullName,
                phone: inputs.phone,
                UserId: inputs.UserId,
                date: inputs.date,
                reason: inputs.reason,
            }
            let isValid = true

            for (const [key, value] of Object.entries(fields)) {
                if (key as keyof typeof fields && !value) {
                    fields = {
                        ...fields,
                        [key]: "Veuillez renseigner ce champs"
                    }
                    isValid = false;
                    setRequireFields(fields);
                }
            }
            if (!isValid) return;
            setRequireFields({
                fullName: "",
                phone: "",
                UserId: null,
                date: "",
                reason: "",
            });
            setIsLoading(true);
            const response = await providers.API.post(
                "https://vps118934.serveur-vps.net:4001",
                "createAppointment",
                null,
                inputs
            )
            if (response.status) {
                localStorage.removeItem("inputMemoryOfAddAppointmentPage");
                toast.success("Bravo", "Rendez-vous enregistré");
                window.location.reload();
            }

        } catch (error) {
            console.error("Erreur lors de la création :", error);
            const errText = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
            toast.error("Erreur", errText);
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
        isSessionLoading: sessionStatus === "loading",
        requireFields
    };
}