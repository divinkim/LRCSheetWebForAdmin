"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { providers } from "../..";
import { VerifyOtpResponse } from "@/types/global";

const API_URL = providers.APIUrl;

const ENDPOINTS = {
  requestOtp: "reset-password/request-otp",
  verifyOtp: "reset-password/verify-otp",
  resetPassword: "reset-password/reset",
};

export const OTP_LENGTH = 6;
export const MIN_PASSWORD = 8;
const RESEND_DELAY = 60; // secondes avant de pouvoir renvoyer le code

export type ResetStep = "email" | "otp" | "password" | "done";

const emptyOtp = (): string[] => Array(OTP_LENGTH).fill("");

export default function useResetPassword() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmailState] = useState<string>("");
  const [otp, setOtpState] = useState<string[]>(emptyOtp());
  const [password, setPasswordState] = useState<string>("");
  const [confirm, setConfirmState] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [info, setInfo] = useState<string>("");
  const [cooldown, setCooldown] = useState<number>(0);
  const resetToken = useRef<string | null>(null);

  // Compte à rebours du bouton « Renvoyer le code »
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // Réinitialise l'erreur à chaque saisie dans un champ
  const edit = <T,>(setter: (val: T) => void) => (value: T) => {
    setError("");
    setter(value);
  };

  const run = async (task: () => Promise<void>) => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      await task();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  /* ---- Étape 1 : Saisie e-mail & Envoi du code ---- */
  const sendEmail = (e?: FormEvent) => {
    e?.preventDefault();
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setError("Saisissez une adresse e-mail valide.");
      return;
    }
    return run(async () => {
      await providers.API.post(API_URL, ENDPOINTS.requestOtp, null, { email: value });
      setEmailState(value);
      setOtpState(emptyOtp());
      setCooldown(RESEND_DELAY);
      setStep("otp");
    });
  };

  /* ---- Étape 2 : Vérification du code OTP ---- */
  const verifyOtp = (e?: FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError(`Saisissez les ${OTP_LENGTH} chiffres du code.`);
      return;
    }
    return run(async () => {
      const data = await providers.API.post<VerifyOtpResponse>(
        API_URL,
        ENDPOINTS.verifyOtp,
        null,
        { email, otp: code }
      );
      resetToken.current = data?.resetToken ?? null;
      setStep("password");
    });
  };

  /* ---- Renvoyer un nouveau code OTP ---- */
  const resend = () => {
    if (cooldown > 0 || loading) return;
    return run(async () => {
      await providers.API.post(API_URL, ENDPOINTS.requestOtp, null, { email });
      setOtpState(emptyOtp());
      setCooldown(RESEND_DELAY);
      setInfo(`Un nouveau code a été envoyé à ${email}.`);
    });
  };

  const changeEmail = () => {
    setError("");
    setInfo("");
    setOtpState(emptyOtp());
    setStep("email");
  };

  /* ---- Étape 3 : Définition du nouveau mot de passe ---- */
  const submitPassword = (e?: FormEvent) => {
    e?.preventDefault();
    if (password.length < MIN_PASSWORD) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD} caractères.`);
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    return run(async () => {
      await providers.API.post(API_URL, ENDPOINTS.resetPassword, null, {
        email,
        otp: otp.join(""),
        resetToken: resetToken.current,
        password,
      });
      setPasswordState("");
      setConfirmState("");
      setStep("done");
    });
  };

  /* ---- Remise à zéro complète ---- */
  const restart = (initialEmail = "") => {
    setStep("email");
    setEmailState(initialEmail);
    setOtpState(emptyOtp());
    setPasswordState("");
    setConfirmState("");
    setError("");
    setInfo("");
    setCooldown(0);
    setLoading(false);
    resetToken.current = null;
  };

  return {
    step,
    email,
    otp,
    password,
    confirm,
    loading,
    error,
    info,
    cooldown,
    setEmail: edit(setEmailState),
    setOtp: edit(setOtpState),
    setPassword: edit(setPasswordState),
    setConfirm: edit(setConfirmState),
    sendEmail,
    verifyOtp,
    resend,
    changeEmail,
    submitPassword,
    restart,
  };
}