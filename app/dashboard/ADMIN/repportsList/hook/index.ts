"use client";
import { providers } from "@/index";
import HookComponentModal from "@/components/ComponentModal";
import { isValidElement, useEffect, useState } from "react";
import SidebarHook from "@/components/Layouts/sidebar/hook";
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

export function RepportsListHook() {
    const ComponentModal = HookComponentModal();
    const [itemIndex, setItemIndex] = useState<number | null>(null);
    const [itemIndexOnWriting, setItemIndexOnWriting] = useState<number | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [adminResponse, setAdminResponse] = useState("");
    const [monthIndice, setMonthIndice] = useState(new Date().getMonth());
    const [RepportsArray, setRepportsArray] = useState<RepportsValue[]>([]);
    const [repportsArrayCloned, setRepportsArrayCloned] = useState<RepportsValue[]>([]);
    const [EnterpriseId, setEnterpriseId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [adminReportCommentArray, setAdminReportCommentArray] =useState<any[]>([])
    const { setStoredNotificationsArray } = SidebarHook();

    useEffect(() => {
        (async() => {
            if (typeof (window) === "undefined") return;
            if (ComponentModal) {
                let EnterpriseId = localStorage.getItem("EnterpriseId");
                setRepportsArray(ComponentModal.at(0)?.Repport?.repportsArray ?? []);
                setRepportsArrayCloned(ComponentModal.at(0)?.Repport?.repportsArray ?? []);
                setEnterpriseId(EnterpriseId);
            }
            const getAdminRepportComment = await providers.API.getAll(providers.APIUrl, "getAdminReportComment", null);
            setAdminReportCommentArray(getAdminRepportComment)
            setStoredNotificationsArray([]);
            localStorage.removeItem("storedNotificationsArray");
        })()
    }, [ComponentModal?.at(0)?.Repport?.repportsArray]);

    const monthsOfYear = [
        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"
    ];

    function navigateBetweenMonths(repportArray: RepportsValue[], monthIndice: number, EnterpriseId: number) {
        const newRepportsArray = repportArray.filter(repport => repport.EnterpriseId === EnterpriseId && repport.monthIndice === monthIndice);
        return setRepportsArrayCloned(newRepportsArray)
    }

    function filterRepportsByUsersNames(value: string, monthIndice: number) {
        const repports = RepportsArray.filter(repport => (repport.User?.firstname.toLocaleLowerCase()?.includes(value.toLocaleLowerCase()) || repport.User?.lastname.toLocaleLowerCase()?.includes(value.toLocaleLowerCase())) && repport.monthIndice === monthIndice);
        setRepportsArrayCloned(repports)
    }

    async function adminReportComment(content: string, RepportId: number, email: string, UserId: number) {
        setIsLoading(true);
        if (!content) {
            return providers.alertMessage(false, "Champ invalide", "Veuillez saisir un commentaire", null)
        }

        const response = await providers.API.post(providers.APIUrl, "addAdminReportComment", null, {
            UserId,
            content,
            RepportId
        });
        console.log(response);
        if(response.status) setAdminResponse("")
       
    }

    return { itemIndex, setItemIndex, isVisible, setIsVisible, itemIndexOnWriting, setItemIndexOnWriting, setAdminResponse, setMonthIndice, monthIndice, repportsArrayCloned, EnterpriseId, ComponentModal, filterRepportsByUsersNames, navigateBetweenMonths, adminResponse, monthsOfYear, RepportsArray, adminReportComment, isLoading, setIsLoading, adminReportCommentArray}
}