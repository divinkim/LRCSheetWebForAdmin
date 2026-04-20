"use client";
import { providers } from "@/index";
import { useEffect, useState } from "react";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";
import { getToken } from "firebase/messaging";
import Swal from "sweetalert2";

export default function useAuth() {
    const [showPassword, setShowPassword] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [inputs, setInputs] = useState({
        email: "",
        password: ""
    })
    const [message, setMessage] = useState("");
    const messaging = getFirebaseMessaging();
    const alertMessage = (message: string) => {
        setShowSpinner(false);
        setMessage(message)
        setTimeout(() => {
            setMessage("")
        }, 3000);
        return;
    }

    useEffect(() => {
        (async () => {
            try {
                await Notification.requestPermission().then(async (permission) => {
                    if (permission === "granted") {
                        if (!messaging) return
                        console.log("permission accordée")
                        const adminFcmToken = await getToken(messaging, {
                            vapidKey: "BM91689dVSwzQt0EWC0MmE0UBLvdkXzahkR0-UFppnWI3rOP8OTakisMCaxco0lXPZzx6jmxbtsbzWECTN6K6lg",
                        });
                        console.log("le token", adminFcmToken)
                        if (adminFcmToken) localStorage.setItem("adminFcmToken", adminFcmToken);
                    } else {
                        console.log("permissions non accordées")
                    }
                })
            } catch (error) {
                console.error(error)
            }
        })();
    }, [])

    const authFunction = async () => {
        setShowSpinner(true);

        const email = inputs.email;
        const password = inputs.password;
        const emailRegex = /^[a-z0-9]+@[a-z]+\.[a-z]{2,}$/;

        if (!email || !password) {
            alertMessage("Veuillez saisir tous les champs.")
        } else if (!emailRegex.test(email)) {
            alertMessage("Veuillez saisir une adresse mail valide.")
            return;
        }

        const requireUserRoles = ['Super-Admin', 'Moderator-Admin', 'Supervisor-Admin'];


        const response = await providers.API.post(providers.APIUrl, "loginFromAdmin", null, {
            email, password
        });

        if (!response.status) {
            alertMessage(response.message)
            return;
        }

        const data = {
            id: response.user.id.toString(),
            firstname: response.user.firstname,
            lastname: response.user.lastname,
            image: response.user.image,
            authToken: response.user.authToken,
            adminRole: response.user?.adminRole,
            EnterpriseId: response.user?.EnterpriseId,
            adminService: response.user.adminService,
        }

        if (!requireUserRoles.includes(data.adminRole)) {
            return alertMessage("Vous n'avez aucun droit d'accès à cette plateforme. Veuillez contacter votre administrateur.")
        }

        for (const [key, value] of Object.entries(data)) {
            localStorage.setItem(key, String(value));
        }

        return window.location.href = "/home";
    }

    return { showPassword, setShowPassword, showSpinner, authFunction, message, inputs, setInputs }
}