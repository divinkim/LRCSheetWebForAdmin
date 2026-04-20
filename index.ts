const APIUrl = "https://vps118934.serveur-vps.net:8500";

interface MonthData {
    monthIndice: number;
    EnterpriseId: number,
    User: {
        lastname: string,
        firstname: string
    }
    [key: string]: unknown;
}

import { faBreadSlice } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

export const validateFields = (input: string | undefined) => {
    if (input === "" || input === undefined) {
        return false
    }
    else {
        return true
    }
}

const verifyRequireField = (data: Record<string, string | number>) => {
    for (const [_, value] of Object.entries(data)) {
        if (value === "" || value === null || value === undefined || ((Array.isArray(value)) && value?.length === 0)) {
            return {
                message: alertMessage(false, "Champs invalides", "Veuillez remplir tous les champs obligatoires", null),
                status: false,
            }
        }
    }
    return { status: true };
}

export const speak = (text: string) => {
    const synth = window.speechSynthesis;

    const speakNow = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";

        // Choisir une voix française si dispo
        const voices = synth.getVoices();
        const frenchVoice = voices.find(v => v.lang.startsWith("fr"));
        if (frenchVoice) {
            utterance.voice = frenchVoice;
        }

        utterance.rate = 1.5;
        utterance.pitch = 1.5;
        synth.speak(utterance);
    };

    // Voix déjà prêtes ?
    if (synth.getVoices().length > 0) {
        speakNow();
    } else {
        // Attendre le chargement des voix
        synth.onvoiceschanged = () => speakNow();
    }
};

function alertMessage(status: boolean, title: string, message: string, path: string | null) {
    setTimeout(async () => {
        return Swal.fire({
            icon: status ? "success" : "error",
            title,
            text: message,
        }).then((confirm) => {
            if (confirm.isConfirmed && path !== null) {
                window.location.href = `${path}`;
            }
        });
    }, 1000)
}

function navigateBetweenMonths(array: MonthData[], monthIndice: number) {
    const filterDatasByCurrentmonth = array.filter((data: { monthIndice: number }) => data.monthIndice === monthIndice);
    return filterDatasByCurrentmonth;
}

const filterDataOfAdministrationSection = (array: MonthData[], input: string, monthIndice: number, getAdminEnterpriseId: number) => {
    const datas = array.filter((data: { monthIndice: number, EnterpriseId: number, User: { lastname: string, firstname: string } }) => data.monthIndice === monthIndice && data.EnterpriseId === getAdminEnterpriseId && (data.User?.firstname.toLowerCase()?.includes(input.toLowerCase())) || data.User?.lastname?.toLowerCase().includes(input.toLowerCase()));
    return datas;
}

const daysOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function reduceLengthOfText(text: string, maxLength: number) {
    if (typeof (text) !== "undefined") {
        if (text.length > maxLength) {
            return text.slice(0, maxLength).trim() + "...";
        }
        return text;
    }
}

export class Api {
    async getOne(url: string, methodName: string, id: string | number) {
        console.log(id)
        try {
            const response = await fetch(`${url}/api/${methodName}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                console.log("Erreur:", error.message);
                return
            }

            const result = await response.json();
            return result.datas;

        } catch (error) {
            console.error({ message: "Erreur réseau veuillez réessayer", error: error });
            console.log(error)
        }
    }

    async getAll(url: string, methodName: string, id: string | number | null) {
        try {
            const request = id !== null ? `${url}/api/${methodName}/${id}` : `${url}/api/${methodName}`;

            const response = await fetch(request, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const error = await response.json();
                console.log({ Erreur: error.message });
                return [];
            }

            const result = await response.json();
            console.log(result.datas);
            return result.datas;

        } catch (error) {
            console.error({ message: "Une erreur est survenue lors de l'exécution de cette opération veuillez réessayer à nouveau!", error: error });
        }
    }

    async update(fullUrl: string, methodName: string, token = null, data = {}, id: string | null | number) {
        try {
            const headers: Record<string, string> = {};
            let body: BodyInit;
            const formData = new FormData();

            // Construction de l'URL
            fullUrl = id !== null
                ? `${APIUrl}/api/${methodName}/${id}`
                : `${APIUrl}/api/${methodName}`;

            // Vérifie si au moins un File ou Blob est présent dans data
            const isPresentFile = Object.values(data).some(
                (value) => value instanceof File || value instanceof Blob
            );

            if (isPresentFile) {
                for (const [key, value] of Object.entries(data)) {
                    // FormData accepte string, Blob ou File
                    if (value instanceof File || value instanceof Blob || value !== null && value !== undefined) {
                        formData.append(key, String(value));
                    }
                }
                body = formData;
            } else {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(data);
            }

            const response = await fetch(fullUrl, {
                method: 'PUT',
                headers,
                body,
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error(error);
            return {
                title: "Une erreur est survenue lors de l'exécution de cette opération!",
                message: "Veuillez contacter le service technique pour plus d'infos",
                status: false,
            };
        }
    }

    async post(url: string, methodName: string, token = null, data = {}) {
        try {
            const isPresentFile = Object.entries(data).some(([_, value]) => typeof value === "object" && (value instanceof File || value instanceof Blob));

            console.log(`${url}/api/${methodName}`)

            const headers: Record<string, string> = {};
            let body: BodyInit;
            const formData = new FormData();

            if (token !== null) {
                headers['Authorization'] = `Bearer ${token}`
            }

            if (isPresentFile) {
                for (const [key, value] of Object.entries(data)) {
                    if (value instanceof File || value instanceof Blob) {
                        formData.append(key, value);
                    } else if (typeof value === "object") {
                        formData.append(key, JSON.stringify(value));
                    } else {
                        formData.append(key, String(value));
                    }
                }

                body = formData;
            } else {
                headers['Content-Type'] = "application/json";
                body = JSON.stringify(data);
            }

            const response = await fetch(`${url}/api/${methodName}`, {
                method: 'POST',
                headers,
                body,
            });

            const result = await response.json();
            return result;

        } catch (error) {
            console.error({ message: "Une erreur est survenue lors de l'exécution de cette opération veuillez réessayer à nouveau!", error: error });
            return {
                title: "Une erreur est survenue lors de l'exécution de cette opération!",
                message: "Veuillez contacter le service technique pour plus d'infos.",
                status: false,
            }
        }
    }

    async delete(APIUrl: string | null, methodName: string | null, UserId: number | null, data: Record<string, any> = {}) {
        try {
            const endPoint = `${APIUrl}/api/${methodName}/${UserId}`;

            console.log(endPoint);

            const request = await fetch(endPoint, {
                method: "delete",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const response = await request.json();

            if (!request.ok) {
                return response;
            }

            return response;

        } catch (error) {
            return {
                message: "Veuillez vérifier votre connexion au réseau !",
                title: "Une erreur est survenue lors de l'exécution de ce processus.",
                status: false,
            }
        }
    }
}

export const API = new Api();

export const providers = { alertMessage, API, navigateBetweenMonths, daysOfWeek, filterDataOfAdministrationSection, verifyRequireField, APIUrl, reduceLengthOfText }



