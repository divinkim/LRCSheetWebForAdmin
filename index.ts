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
        try {
            const req = await fetch(`${url}/api/${methodName}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const res = await req.json();

            if (!req.ok) {
                throw new Error(res.message);
            }

            return res.datas;

        } catch (error) {
            throw error;
        }
    }

    async getAll(url: string, methodName: string, id: string | number | null) {
        try {
            const endPoint = id !== null ? `${url}/api/${methodName}/${id}` : `${url}/api/${methodName}`;

            const req = await fetch(endPoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const res = await req.json();

            if (!req.ok) {
                throw new Error(res.message);
            }

            return res.datas;

        } catch (error) {
            throw error;
        }
    }

    async update(url: string, methodName: string, token = null, data = {}, id: string | null | number) {
        try {
            const headers: Record<string, string> = {};
            let body: BodyInit;
            const formData = new FormData();

            url = id ? `${url}/api/${methodName}/${id}` : `${url}/api/${methodName}`

            console.log(url)

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

            const req = await fetch(url, {
                method: 'PUT',
                headers,
                body,
            });

            const res = await req.json();

            if (!req.ok) {
                throw new Error(res.message) ?? "Erreur inconnue";
            }
            return res;

        } catch (error) {
            console.error(error);
            throw error
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

            const req = await fetch(`${url}/api/${methodName}`, {
                method: 'POST',
                headers,
                body,
            });

            const res = await req.json();
            if (!req.ok) {
                throw new Error(res.message) ?? "Erreur inconnue";
            }

            return res;

        } catch (error) {
            throw error
        }
    }

    async delete(APIUrl: string, methodName: string, UserId: number, data: Record<string, any> = {}) {
        try {
            const endPoint = `${APIUrl}/api/${methodName}/${UserId}`;

            console.log(endPoint);

            const req = await fetch(endPoint, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const res = await req.json();

            if (!req.ok) {
                throw new Error(res.message) ?? "Erreur inconnue";
            }

            return res;

        } catch (error) {
            throw error;
        }
    }

    async deleteMany(APIUrl: string, methodName: string) {
        try {
            const endPoint = `${APIUrl}/api/${methodName}`;

            console.log(endPoint);

            const req = await fetch(endPoint, {
                method: "delete",
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const res = await req.json();

            if (!req.ok) {
                throw new Error(res.message) ?? "Erreur inconnue";
            }

            return res;

        } catch (error) {
            throw error
        }
    }
}

const API = new Api();

export const providers = {
    alertMessage,
    API,
    navigateBetweenMonths,
    daysOfWeek,
    filterDataOfAdministrationSection,
    verifyRequireField,
    APIUrl,
    reduceLengthOfText
}



