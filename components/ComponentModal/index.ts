"use client";
import { providers } from "@/index";
import { useEffect, useState } from "react";

type RepportsValue = {
    id: number,
    title: string,
    content: string,
    files: string,
    UserId: number,
    EnterpriseId: number,
    monthIndice: number,
    createdAt: string,
    adminResponse: string,
    User: {
        firstname: string,
        lastname: string,
        email: string,
        photo: string,
    }
}

export default function HookComponentModal() {
    if (typeof (window) === "undefined") return
    const [repports, setRepports] = useState<RepportsValue[]>([]);
    const [tasks, setTasks] = useState<RepportsValue[]>([])
    let EnterpriseId = localStorage.getItem("EnterpriseId");

    useEffect(() => {
        (async () => {
            const allRepports = await providers.API.getAll(providers.APIUrl, "getAllRepports", null);
            if (parseInt(EnterpriseId ?? "") !== 1) {
                const getRepportsByEnterprise = allRepports.filter((repport: { EnterpriseId: number }) => repport.EnterpriseId === parseInt(EnterpriseId ?? ""));
                return setRepports(getRepportsByEnterprise)
            }
            const getRepportsByEnterprise = allRepports.filter((repport: { EnterpriseId: number }) => [1, 4].includes(repport.EnterpriseId));
            setRepports(getRepportsByEnterprise)
        })();
    }, []);

    //Récupération des tâches

    useEffect(() => {
        (async () => {
            const Tasks = await providers.API.getAll(providers.APIUrl, "getAllTasks", null);
            if (parseInt(EnterpriseId ?? "") !== 1) {
                const getRepportsByEnterprise = Tasks.filter((repport: { EnterpriseId: number }) => repport.EnterpriseId === parseInt(EnterpriseId ?? ""));
                return setTasks(getRepportsByEnterprise)
            }
            const getRepportsByEnterprise = Tasks.filter((repport: { EnterpriseId: number }) => [1, 4, null].includes(repport.EnterpriseId));
            setTasks(getRepportsByEnterprise)
        })()
    }, [repports])

    const ComponentModal = [
        {
            Repport: {
                titlePage: "Liste des rapports",
                path: "Dashboard/Administration/Rapports",
                repportsArray: repports
            }
        },
        {
            Task: {
                titlePage: "Liste des tâches",
                path: "Dashboard/Administration/Tâches",
                taskArray: tasks
            }
        },

        {

        }
    ]

    return ComponentModal;
}
