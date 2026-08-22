"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const [userInfo, setUserInfo] = useState<User>({
    image: null,
    fullName: null,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const lastname = localStorage.getItem("lastname") || "";
    const firstname = localStorage.getItem("firstname") || "";
    const photo = localStorage.getItem("photo");

    const fullName = `${lastname} ${firstname}`.trim();

    setUserInfo({
      image: photo,
      fullName: fullName || "Administrateur",
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between dark:border-b dark:border-slate-700/60 dark:bg-slate-900 px-4 py-3.5 shadow-md md:px-6 2xl:px-10 bg-white">
      {/* Bouton Menu Mobile & Logo */}
      <div className="lg:hidden flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Sidebar"
          className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 lg:hidden"
        >
          <MenuIcon />
          <span className="sr-only">Menu</span>
        </button>

        {isMobile && (
          <Link href="/" className="ml-1 transition-opacity hover:opacity-80">
            {/* <img
              src="/images/logo/logo-icon.svg"
              width={32}
              height={32}
              alt="Logo"
            /> */}
          </Link>
        )}
      </div>

      {/* Titre / Branding Admin (Desktop) */}
      <div className="hidden lg:flex lg:items-center lg:gap-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-amber-500/30 bg-slate-800 shadow-xs">
          {/* <img
            src={`${providers}/images/${userInfo.image}` || "/images/adminProfile.png"}
            alt="Profil Admin"
            className="object-cover"
          /> */}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-white">
              {userInfo.fullName || "Service Admin"}
            </span>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-slate-400">Espace de gestion & administration</p>
        </div>
      </div>

      {/* Actions Droite (Theme, User) */}
      <div className="flex items-center justify-end gap-3 min-[375px]:gap-4">
        <div className="flex items-center  p-1">
          <ThemeToggleSwitch />
        </div>

        <div className="h-6 w-px bg-slate-700/80" />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}