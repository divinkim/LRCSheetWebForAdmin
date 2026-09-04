"use client"
import { useEffect, useState } from "react";
import { providers } from "@/index";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/toast";
type User = {
    lastname: string,
    firstname: string,
    photo: string | null,
    email: string,
    id: number,
    DepartmentPost: {
        name: string | undefined
    }
    EnterpriseId: number,
    Enterprise: {
        MainEnterpriseId: number | null
    },
    status: boolean
}

type Data = {
    title: string,
    content: string,
    usersIds: number[],
    EnterpriseId: string,
    UserId: string,
    emails: string[]
}

export default function useNotifications() {
    const [isLoading, setIsLoading] = useState(false)
    const [inputs, setInputs] = useState<Data>({
        title: "",
        content: "",
        usersIds: [],
        EnterpriseId: "",
        UserId: "",
        emails: []
    });
    const [files, setFiles] = useState("")
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [usersCloned, setUsersCloned] = useState<User[]>([]);
    const [UserId, setUserId] = useState<number | null>(null)
    const [EnterpriseId, setEnterpriseId] = useState<number | null>(null)
    const [role, setRole] = useState<string | null>(null)
    const [loader, setLoader] = useState(true);
    const toast = useToast();
    const { data: session } = useSession();
    const [email, setEmail] = useState<string | null>(null)
    const BASE_URL = "https://vps118934.serveur-vps.net:4001";

    useEffect(() => {
        (async () => {
            try {
                const EnterpriseId = Number((session?.user as any)?.EnterpriseId);
                const UserId = Number((session?.user as any)?.id);
                const email = String((session?.user as any)?.email);
                const role = String((session?.user as any)?.adminRole);

                const users = await providers.API.getAll(BASE_URL, "getUsers", null);

                let getUsersbyAdminRole: User[] = users;

                console.log(session?.user)

                if (role === "Super_Admin_Platform") {
                    setUsers(users);
                    setUsersCloned(users)
                } else if (role === "Super_Admin_Enterprise") {
                    getUsersbyAdminRole = getUsersbyAdminRole.filter(user => user?.Enterprise?.MainEnterpriseId === Number(EnterpriseId) && user.status);
                    setUsers(getUsersbyAdminRole);
                    setUsersCloned(getUsersbyAdminRole)
                } else if (role === "Enterprise_Admin") {
                    getUsersbyAdminRole = getUsersbyAdminRole.filter(user => user.EnterpriseId === Number(EnterpriseId) && user.status);
                    setUsers(getUsersbyAdminRole);
                    setUsersCloned(getUsersbyAdminRole)
                }
                setUserId(UserId);
                setEnterpriseId(EnterpriseId);
                setRole(role);
                setEmail(email)
            } catch (error) {
                console.log(error);
            } finally {
                setLoader(false)
            }
        })()
    }, [session?.user]);

    async function handleSubmit() {
        try {
            if (!inputs.title.trim() || !inputs.content.trim() || inputs.usersIds.length === 0) {
                toast.error(
                    "Champs invalides",
                    "Veuillez sélectionner un titre et saisir un contenu"
                );
                return;
            }

            setIsLoading(true);


            const data = {
                title: inputs.title,
                content: inputs.content,
                EnterpriseId: Number(EnterpriseId),
                UserId: Number(UserId),
                role,
                files,
            };
            console.log(inputs.usersIds)
            // await providers.API.post(BASE_URL, "sendMail", null, {
            //     subject: inputs.title,
            //     content: inputs.content,
            //     emails: inputs.emails,
            //     senderEmail: "murphykimbatsa@gmail.com",
            // });

            for (const receiverId of inputs.usersIds) {
                const notification = await providers.API.post(BASE_URL, "sendNotificationPush", null, {
                    path: "",
                    messagingType: "general",
                    title: inputs.title,
                    content: inputs.content,
                    EnterpriseId: String(EnterpriseId),
                    file: files,
                    senderId: UserId,
                    receiverId: String(receiverId),
                    adminSectionIndex: "0",
                    adminPageIndex: "1",
                    email
                });
                console.log(notification)
                // providers.API.post(BASE_URL, "createChatMessage", null, {
                //     content: inputs.content,
                //     title: inputs.title,
                //     receiverId: receiverId,
                //     senderId: UserId,
                //     EnterpriseId,
                //     file: data.files,
                //     role,
                // })
            }

            setInputs({
                title: "",
                content: "",
                EnterpriseId: "",
                UserId: "",
                emails: [],
                usersIds: [],
            });
            setFiles("");

            toast.success(
                "Bravo",
                "Le collaborateur a été notifié avec succès."
            );
        } catch (error) {
            console.error(error);
            toast.error(
                "Erreur",
                error instanceof Error ? error.message : "Erreur réseau"
            );
        } finally {
            setIsLoading(false);
        }
    }

    const onCheck = (email: string, targetUserId: number) => {
        const updatedEmails = inputs.emails.includes(email)
            ? inputs.emails.filter((item) => item !== email)
            : [...inputs.emails, email];

        const updatedUsersIds = inputs.usersIds.includes(targetUserId)
            ? inputs.usersIds.filter((item) => item !== targetUserId)
            : [...inputs.usersIds, targetUserId];

        setInputs({
            ...inputs,
            emails: updatedEmails,
            usersIds: updatedUsersIds,
        });
    };

    function filterUsersByFullName(value: string) {
        const query = value.toLowerCase();
        const filtered = usersCloned.filter(
            (user) =>
                user.firstname.toLowerCase().includes(query) ||
                user.lastname.toLowerCase().includes(query)
        );
        setUsers(filtered);
    }

    function filterUsersByDepartment(value: string) {
        const query = value.toLowerCase();
        const filtered = usersCloned.filter((user) =>
            user.DepartmentPost?.name?.toLowerCase().includes(query)
        );
        setUsers(filtered);
    }


    return {
        isLoading,
        setIsLoading,
        inputs,
        handleSubmit,
        setInputs,
        showModal,
        setShowModal,
        users,
        onCheck,
        filterUsersByFullName,
        files,
        setFiles,
        filterUsersByDepartment,
        loader
    }
}