"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faSpinner,
  faEnvelope,
  faLock,
  faKey,
  faPaperPlane,
  faArrowLeft,
  faCircleCheck,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";

import Cell from "../Cell";
import { OTP_LENGTH, MIN_PASSWORD } from "./useResetPassword";

const STEPS = ["email", "otp", "password"];
const STEP_LABELS = ["Adresse e-mail", "Code de vérification", "Nouveau mot de passe"];

/* ---------------------------------------------------------------
   PETITS COMPOSANTS
--------------------------------------------------------------- */
function Alert({ tone = "error", children }) {
  if (!children) return null;
  const styles =
    tone === "error"
      ? "bg-red-50 text-red-700 ring-red-200"
      : "bg-blue-50 text-blue-700 ring-blue-200";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-lg px-3.5 py-3 text-xs font-medium leading-5 ring-1 ${styles}`}
    >
      {children}
    </div>
  );
}

function SubmitButton({ loading, loadingText, label, icon, disabled }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="
        group flex w-full items-center justify-center gap-3
        rounded-lg bg-blue-600 px-5 py-3.5
        text-sm font-bold text-white
        shadow-lg shadow-blue-600/20
        transition-all duration-300
        hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600
        active:scale-[0.99]
        disabled:cursor-not-allowed disabled:opacity-60
      "
    >
      {loading ? (
        <>
          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          <span>{label}</span>
          <FontAwesomeIcon
            icon={icon}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </>
      )}
    </button>
  );
}

function BackLink({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
    >
      <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
      Retour à la connexion
    </button>
  );
}

/* ---------------------------------------------------------------
   SAISIE DU CODE OTP : une cellule par chiffre
   (collage du code complet, backspace et flèches gérés)
--------------------------------------------------------------- */
function OtpInput({ value, onChange, disabled, invalid }) {
  const refs = useRef([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const focusAt = (i) =>
    refs.current[Math.max(0, Math.min(OTP_LENGTH - 1, i))]?.focus();

  const fill = (start, chars) => {
    const next = value.slice();
    chars
      .split("")
      .slice(0, OTP_LENGTH - start)
      .forEach((c, k) => {
        next[start + k] = c;
      });
    onChange(next);
    focusAt(start + chars.length);
  };

  const handleChange = (i, raw) => {
    let chars = raw.replace(/\D/g, "");
    if (!chars) {
      const next = value.slice();
      next[i] = "";
      onChange(next);
      return;
    }
    if (chars.length > 1 && value[i]) chars = chars.slice(-1);
    fill(i, chars);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !value[i] && i > 0) {
      e.preventDefault();
      const next = value.slice();
      next[i - 1] = "";
      onChange(next);
      focusAt(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(i + 1);
    }
  };

  const handlePaste = (i, e) => {
    e.preventDefault();
    const chars = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!chars) return;
    fill(chars.length === OTP_LENGTH ? 0 : i, chars);
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Chiffre ${i + 1} sur ${OTP_LENGTH}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className={`
            h-14 w-full rounded-lg border text-center text-xl font-bold tabular-nums
            text-slate-800 outline-none transition
            focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20
            disabled:opacity-60
            ${digit ? "bg-slate-50" : "bg-white"}
            ${invalid ? "border-red-400" : "border-slate-300 hover:border-slate-400"}
          `}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   PANNEAU PRINCIPAL
   r      : état et actions retournés par useResetPassword()
   onBack : retour à la connexion
--------------------------------------------------------------- */
export default function ResetPassword({ r, onBack }) {
  const [showNew, setShowNew] = useState(false);
  const stepIndex = STEPS.indexOf(r.step);
  const code = r.otp.join("");

  // Succès : retour automatique à la connexion
  useEffect(() => {
    if (r.step !== "done") return;
    const id = setTimeout(onBack, 3500);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.step]);

  /* ---------------- SUCCÈS ---------------- */
  if (r.step === "done") {
    return (
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <FontAwesomeIcon icon={faCircleCheck} className="text-2xl text-emerald-500" />
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight text-amber-500 sm:text-[2rem]">
          Mot de passe réinitialisé
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Votre mot de passe a été modifié. Vous pouvez maintenant vous connecter
          avec le nouveau.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Retour à la connexion
        </button>

        <p className="mt-4 text-xs text-slate-400">
          Redirection automatique dans quelques secondes...
        </p>
      </div>
    );
  }

  /* ---------------- ÉTAPES 1 À 3 ---------------- */
  const description = {
    email:
      "Renseignez l’adresse e-mail de votre compte administrateur. Un code de vérification vous sera envoyé.",
    otp: (
      <>
        Saisissez le code à {OTP_LENGTH} chiffres envoyé à{" "}
        <strong className="font-semibold text-slate-700">{r.email}</strong>.
      </>
    ),
    password: "Choisissez un nouveau mot de passe pour votre espace d’administration.",
  }[r.step];

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <span className="mb-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
          <FontAwesomeIcon icon={faShieldHalved} className="text-[11px]" />
          Espace sécurisé
        </span>

        <h2 className="text-3xl font-extrabold tracking-tight text-amber-500 sm:text-[2rem]">
          Réinitialiser le mot de passe
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      {/* Progression */}
      <div className="mb-6">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= stepIndex ? "bg-blue-600" : "bg-slate-200"
                }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">
          Étape {stepIndex + 1} sur {STEPS.length} : {STEP_LABELS[stepIndex]}
        </p>
      </div>

      {/* ---------- ÉTAPE 1 : E-MAIL ---------- */}
      {r.step === "email" && (
        <form onSubmit={r.sendEmail} className="space-y-4">
          <Alert>{r.error}</Alert>

          <Cell label="Adresse e-mail" icon={faEnvelope}>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoFocus
              required
              autoComplete="email"
              value={r.email}
              onChange={(e) => r.setEmail(e.target.value)}
              placeholder="admin@lrcsheet.com"
              className="block w-full rounded-b-lg bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Cell>

          <SubmitButton
            loading={r.loading}
            loadingText="Envoi en cours..."
            label="Envoyer le code"
            icon={faPaperPlane}
          />
        </form>
      )}

      {/* ---------- ÉTAPE 2 : CODE OTP ---------- */}
      {r.step === "otp" && (
        <form onSubmit={r.verifyOtp} className="space-y-4">
          <Alert>{r.error}</Alert>
          <Alert tone="info">{r.info}</Alert>

          <div role="group" aria-labelledby="otp-label">
            <p id="otp-label" className="mb-2 text-xs font-semibold text-slate-600">
              Code de vérification
            </p>
            <OtpInput
              value={r.otp}
              onChange={r.setOtp}
              disabled={r.loading}
              invalid={Boolean(r.error)}
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-xs">
            <button
              type="button"
              onClick={r.changeEmail}
              className="font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              Modifier l’adresse e-mail
            </button>

            <button
              type="button"
              onClick={r.resend}
              disabled={r.cooldown > 0 || r.loading}
              className="font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {r.cooldown > 0
                ? `Renvoyer le code dans ${r.cooldown} s`
                : "Renvoyer le code"}
            </button>
          </div>

          <SubmitButton
            loading={r.loading}
            loadingText="Vérification en cours..."
            label="Vérifier le code"
            icon={faKey}
            disabled={code.length < OTP_LENGTH}
          />
        </form>
      )}

      {/* ---------- ÉTAPE 3 : NOUVEAU MOT DE PASSE ---------- */}
      {r.step === "password" && (
        <form onSubmit={r.submitPassword} className="space-y-4">
          <Alert>{r.error}</Alert>

          <Cell label="Nouveau mot de passe" icon={faLock}>
            <input
              id="new-password"
              name="new-password"
              type={showNew ? "text" : "password"}
              autoFocus
              required
              autoComplete="new-password"
              value={r.password}
              onChange={(e) => r.setPassword(e.target.value)}
              placeholder="Votre nouveau mot de passe"
              className="block w-full rounded-b-lg bg-transparent py-3 pl-10 pr-12 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <FontAwesomeIcon icon={showNew ? faEyeSlash : faEye} className="text-sm" />
            </button>
          </Cell>

          <Cell
            label="Confirmer le mot de passe"
            icon={faLock}
            error={
              r.confirm && r.password !== r.confirm
                ? "Les mots de passe ne correspondent pas."
                : null
            }
          >
            <input
              id="confirm-password"
              name="confirm-password"
              type={showNew ? "text" : "password"}
              required
              autoComplete="new-password"
              value={r.confirm}
              onChange={(e) => r.setConfirm(e.target.value)}
              placeholder="Répétez le mot de passe"
              className="block w-full rounded-b-lg bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Cell>

          <p
            className={`flex items-center gap-2 text-xs font-medium transition-colors ${r.password.length >= MIN_PASSWORD ? "text-emerald-600" : "text-slate-500"
              }`}
          >
            <FontAwesomeIcon icon={faCircleCheck} className="text-[11px]" />
            {MIN_PASSWORD} caractères minimum
          </p>

          <SubmitButton
            loading={r.loading}
            loadingText="Enregistrement en cours..."
            label="Réinitialiser le mot de passe"
            icon={faLock}
          />
        </form>
      )}

      <BackLink onClick={onBack} />
    </div>
  );
}
