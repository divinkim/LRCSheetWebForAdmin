"use client"
import { useEffect, useState } from "react";
import { providers } from "@/index";
import Swal from "sweetalert2";

type User = {
    lastname: string,
    firstname: string,
    photo: string | null,
    email: string,
    id: number,
    DepartmentPost: {
        name: string | undefined
    }
}

export default function useNotifications() {
    const [isLoading, setIsLoading] = useState(false)
    const [inputs, setInputs] = useState({
        title: "",
        content: "",
        usersIds: [1],
        EnterpriseId: "",
        UserId: "",
        emails: ["murphykimbatsa@gmail.com"]
    });
    const [files, setFiles] = useState<any>(null)
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [usersCloned, setUsersCloned] = useState<User[]>([]);
    const [UserId, setUserId] = useState<number | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [EnterpriseId, setEnterpriseId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            if (typeof (window) === "undefined") return;

            const EnterpriseId = localStorage.getItem("EnterpriseId");
            const UserId = localStorage.getItem("UserId");
            const email = localStorage.getItem("email");

            const getUsers = await providers.API.getAll(providers.APIUrl, "getUsers", null);
            const filtersUsersById = getUsers.filter((user: { EnterpriseId: number, status: boolean }) => user.EnterpriseId === Number(EnterpriseId) && user.status);

            setUsers(filtersUsersById);
            setUsersCloned(filtersUsersById);
            setUserId(Number(UserId));
            setEnterpriseId(Number(EnterpriseId));
            setEmail(email);
        })()
    }, [])

    async function handleSubmit() {
        if (typeof (window) === "undefined") return;
        setIsLoading(true);

        const UserId = localStorage.getItem("UserId");
        const EnterpriseId = localStorage.getItem("EnterpriseId");

        if (!inputs.title || !inputs.content) {
            setTimeout(() => {
                setIsLoading(false);
                Swal.fire({
                    icon: "warning",
                    title: "Champs invalide",
                    text: "Veuillez sélectionner un titre et saisir un contenu"
                })
            }, 1000);
            return;
        }

        const data = {
            title: inputs.title,
            content: inputs.content,
            EnterpriseId: Number(EnterpriseId),
            UserId: Number(UserId),
            role: "Super-Admin",
            files,
        };

        console.log("les inputs", inputs)

        const sendMail = await providers.API.post(providers.APIUrl, "sendMail", null, {
            subject: inputs.title,
            content: inputs.content,
            emails: ["contact@lrcgroup-app.com"],
            senderEmail: "grcinfos@gmail.com",
        });

        for (const UserId of inputs.usersIds) {
            const mail = await providers.API.post(providers.APIUrl, "sendMail", null, {
                subject: "Notification entrante!",
                content: "Veuillez consulter votre messagerie au niveau de l'espace web LRCSheet.",
                emails: inputs.emails,
                senderEmail: "lrcsheet@gmail.com",
            });
            const notification = await providers.API.post(providers.APIUrl, "sendNotificationToWebUser", null, {
                path: "/dashboard/NOTIF/chat",
                messagingType: "notification", //Niveau app mobile
                EnterpriseId: Number(EnterpriseId),
                adminSectionIndex: 0,
                adminPageIndex: 0,
                senderId: 40,
                receiverId: UserId
            })
            const chat = await providers.API.post(providers.APIUrl, "createChatMessage", null, {
                content: inputs.content,
                title: inputs.title,
                receiverId: UserId,
                senderId: 40,
                EnterpriseId: 1,
                file: data.files,
                role: "Super-Admin",
            })
            console.log(notification);
            console.log(chat);
            console.log(mail);
        }

        console.log(sendMail)

        // const response = await providers.API.post(providers.APIUrl, "sendRepport", null, data);

        const status = sendMail.status;
        const message = sendMail.message;
        const title = sendMail.title
        const iconType = status ? "success" : "error";

        if (status) {
            setIsLoading(false);
            setInputs({
                title: "",
                content: "",
                EnterpriseId: "",
                UserId: "",
                emails: [""],
                usersIds: []
            });
            setFiles(null);
        }

        return Swal.fire({
            icon: iconType,
            title: title,
            text: message,
        })
    }

    const onCheck = (email: string, UserId: number) => {
        const checkEmailInEmailsArray = inputs.emails.includes(email) ?
            inputs.emails.filter(item => item !== email) : [...inputs.emails, email];
        const checkIsInUsersIdsArray = inputs.usersIds.includes(UserId) ?
            inputs.usersIds.filter(item => item !== UserId) : [...inputs.usersIds, UserId];
        setInputs({
            ...inputs,
            emails: checkEmailInEmailsArray,
        })
    }

    console.log(inputs)

    function filterUsersByFullName(value: string) {
        const users = usersCloned.filter(user => user.firstname.toLowerCase()?.includes(value.toLowerCase()) || user.lastname.toLowerCase()?.includes(value.toLowerCase()));
        setUsers(users);
    }

    function filterUsersByDepartment(value: string) {
        const users = usersCloned.filter(user => user.DepartmentPost?.name?.toLowerCase().includes(value.toLowerCase()));
        setUsers(users)
    }


    return {
        isLoading, setIsLoading, inputs, handleSubmit, setInputs, showModal, setShowModal, users, onCheck, filterUsersByFullName, files, setFiles, filterUsersByDepartment
    }
}