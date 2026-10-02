"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { providers } from "@/index";

type User = {
  image: string | null;
  fullName: string | null;
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getInitials(name: string | null) {
  if (!name) return "A";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const [userInfo, setUserInfo] = useState<User>({
    image: null,
    fullName: null,
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [greeting, setGreeting] = useState("Bonjour");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastname = localStorage.getItem("lastname") || "";
    const firstname = localStorage.getItem("firstname") || "";
    const photo = localStorage.getItem("photo");

    const fullName = `${lastname} ${firstname}`.trim();

    setUserInfo({
      image: photo && photo !== "null" ? photo : null,
      fullName: fullName || "Administrateur",
    });
    setGreeting(getGreeting());
  }, []);

  const showPhoto = userInfo.image && !imageFailed;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/70 bg-white/75 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60 dark:border-slate-700/50 dark:bg-slate-900/70 dark:supports-[backdrop-filter]:bg-slate-900/60">
      {/* Filet lumineux ambré, signature discrète */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
      />

      <div className="flex items-center justify-between px-4 py-3 md:px-6 2xl:px-10">
        {/* Menu mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={toggleSidebar}
            aria-label="Ouvrir le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 active:scale-95 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <MenuIcon />
            <span className="sr-only">Menu</span>
          </button>

          {isMobile && (
            <Link
              href="/"
              className="ml-1 transition-opacity hover:opacity-80"
            />
          )}
        </div>

        {/* Profil administrateur (desktop) */}
        <div className="hidden items-center gap-4 lg:flex">
          <div className="relative">
            {/* Anneau dégradé autour de l'avatar */}
            <div className="rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-[2px] shadow-lg shadow-amber-500/20">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white dark:bg-slate-900 dark:ring-slate-900">
                {showPhoto ? (
                  <img
                    src={`${providers}/images/${userInfo.image}`}
                    alt={`Photo de ${userInfo.fullName}`}
                    className="h-full w-full object-cover"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <span className="bg-gradient-to-br from-slate-700 to-slate-900 bg-clip-text text-sm font-semibold text-transparent dark:from-slate-100 dark:to-slate-300">
                    {getInitials(userInfo.fullName)}
                  </span>
                )}
              </div>
            </div>

            {/* Pastille de statut */}
            <span className="absolute bottom-0 right-0 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/60 motion-safe:animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            </span>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-slate-800 dark:text-white">
                {greeting}, {userInfo.fullName || "Service Admin"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm shadow-amber-500/30">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-2.5 w-2.5"
                  aria-hidden
                >
                  <path d="M10 1.5l2.4 5.2 5.6.6-4.2 3.8 1.2 5.5L10 13.9 4.99 16.6l1.2-5.5L2 7.3l5.6-.6L10 1.5z" />
                </svg>
                PRO
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Espace de gestion et d&apos;administration
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 min-[375px]:gap-3">
          <div className="flex items-center rounded-full border border-slate-200/80 bg-slate-50/80 p-1 dark:border-slate-700/60 dark:bg-slate-800/60">
            <ThemeToggleSwitch />
          </div>

          <div
            aria-hidden
            className="mx-1 h-7 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent dark:via-slate-600"
          />

          <div className="shrink-0 rounded-xl p-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/60">
            <UserInfo />
          </div>
        </div>
      </div>
    </header>
  );
}
