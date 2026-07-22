"use client";

import { useEffect, useState } from "react";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";
import { getToken } from "firebase/messaging";
import Swal from "sweetalert2";
import { signIn } from "next-auth/react";
import { useToast } from "@/components/toast";
export default function useAuth() {
  const [showPassword, setShowPassword] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
    const toast = useToast();
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [invalidInput, setInvalidInput] = useState({
    email: "",
    password: "",
  });

  const [fcmToken, setFcmToken] = useState<string | null>(null);

  // 1. Gestion des notifications FCM Firebase
  useEffect(() => {
    (async () => {
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          const permission = await Notification.requestPermission();
          
          if (permission === "granted") {
            const messaging = getFirebaseMessaging();
            if (!messaging) return;

            const adminFcmToken = await getToken(messaging, {
              vapidKey: "BM91689dVSwzQt0EWC0MmE0UBLvdkXzahkR0-UFppnWI3rOP8OTakisMCaxco0lXPZzx6jmxbtsbzWECTN6K6lg",
            });

            if (adminFcmToken) {
              console.log("Token FCM récupéré :", adminFcmToken);
              setFcmToken(adminFcmToken);
              localStorage.setItem("adminFcmToken", adminFcmToken);
            }
          } else {
            console.log("Permissions de notification refusées.");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du token FCM :", error);
      }
    })();
  }, []);

  // 2. Fonction d'authentification NextAuth
  const authFunction = async () => {
    try {
      const email = inputs.email.trim();
      const password = inputs.password;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      const passwordRegex = /^[a-zA-Z0-9@!*_.*$]{6,}$/;

      setInvalidInput({ email: "", password: "" });
      setMessage("");

      if (!emailRegex.test(email)) {
        setInvalidInput((prev) => ({
          ...prev,
          email: "Veuillez saisir une adresse email valide.",
        }));
        return;
      }

      if (!passwordRegex.test(password)) {
        setInvalidInput((prev) => ({
          ...prev,
          password: "Veuillez saisir un mot de passe valide (min. 6 caractères).",
        }));
        return;
      }

      setShowSpinner(true);
    
      const request = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (request?.error) {
        setMessage(request.error);
        return;
      }
      if (request?.ok) {
        window.location.href = "/home";
      }
    } catch (error) {
      console.error("Erreur d'authentification:", error);
      const errText = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
      setMessage(errText);
    } finally {
      setShowSpinner(false);
    }
  };

  return {
    showPassword,
    setShowPassword,
    showSpinner,
    authFunction,
    message,
    inputs,
    setInputs,
    invalidInput,
    setInvalidInput,
  };
}