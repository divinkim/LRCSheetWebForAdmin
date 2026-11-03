"use client";
import { providers } from "@/index";
import { Report, ReportsResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
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

    const [repports, setRepports] = useState<Report[]>([]);
    const [tasks, setTasks] = useState<RepportsValue[]>([])
    const { data: session, status } = useSession();


    useEffect(() => {
        (async () => {
            const AdminRole = (session?.user as any)?.adminRole;
            const EnterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId;

            const allRepports = await providers.API.getAll<ReportsResponseDto>(providers.APIUrl, "reports", null);
            const getRepportsByEnterprise: Report[] = allRepports.data.filter(report => report.Enterprise?.MainEnterpriseId === parseInt(EnterpriseIdOfAdmin ?? ""));
            console.log(getRepportsByEnterprise)
            setRepports(getRepportsByEnterprise)
            return;
        })();
    }, [session]);

    //Récupération des tâches

    useEffect(() => {
        (async () => {
            const Tasks = await providers.API.getAll(providers.APIUrl, "getAllTasks", null);
            // if (parseInt(EnterpriseId ?? "") !== 1) {
            //     const getRepportsByEnterprise = Tasks.filter((repport: { EnterpriseId: number }) => repport.EnterpriseId === parseInt(EnterpriseId ?? ""));
            //     return setTasks(getRepportsByEnterprise)
            // }
            // const getRepportsByEnterprise = Tasks.filter((repport: { EnterpriseId: number }) => [1, 4, null].includes(repport.EnterpriseId));
            // setTasks(getRepportsByEnterprise)
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
