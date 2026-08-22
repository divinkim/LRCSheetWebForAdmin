"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faHouse,
  faBell,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";
import socket from "@/socket";
import { providers } from "@/index";
import { useSidebarContext } from "./sidebar-context";
import { SidebarHook } from "./hook";
import Swal from "sweetalert2";
export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { setIsOpen, isOpen, isMobile } = useSidebarContext();
  const [toggleAsideSections, setToggleAsideSections] = useState<number[]>([]);

  const {
    ItemAside,
    getPageNotificationsCount,
    getSectionNotificationsCount,
    storedNotificationsArray,
    setStoredNotificationsArray,
  } = SidebarHook();

  // -------------------------------------------------------------
  // Initialisation de la Socket & FCM avec les données de Session
  // -------------------------------------------------------------
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const user = session.user;
    const userIdNumber = Number(user.id);
    console.log(user)
    // Enregistrement Socket
    socket.emit("register", userIdNumber);

    // Envoi du FCM Token (si disponible dans le localStorage ou la session)
    const adminFcmToken = typeof window !== "undefined" ? localStorage.getItem("adminFcmToken") : null;

    if (adminFcmToken) {
      const datas = {
        fcmToken: adminFcmToken,
        UserId: userIdNumber,
        adminRole: (user as any)?.role,
        UserEnterpriseId: Number((user as any)?.EnterpriseId),
      };

      providers.API.post(
        "https://vps118934.serveur-vps.net:4001",
        "sendFcmToken",
        null,
        datas
      ).catch((err) => console.error("Erreur envoi FCM Token:", err));
    }
  }, [session, status]);

  // -------------------------------------------------------------
  //Auto-ouverture de la section active selon l'URL (Pathname)
  // -------------------------------------------------------------
  useEffect(() => {
    ItemAside.forEach((section, sectionIndex) => {
      const hasActiveChild = section.ItemLists.some((item) => item.href === pathname);
      if (hasActiveChild && !toggleAsideSections.includes(sectionIndex)) {
        setToggleAsideSections((prev) => [...prev, sectionIndex]);
      }
    });
  }, [pathname, ItemAside]);

  // -------------------------------------------------------------
  //Fermeture automatique sur Mobile
  // -------------------------------------------------------------
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [isMobile, setIsOpen]);

  // Basculer l'ouverture/fermeture d'une section
  const handleToggleSection = (index: number) => {
    setToggleAsideSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <>
      {/* Overlay Mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "z-50 flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800/60 shadow-xl",
          isMobile ? "fixed inset-y-0 left-0 w-[280px]" : "sticky top-0 h-screen w-[280px]",
          !isOpen && (isMobile ? "-translate-x-full" : "hidden")
        )}
        aria-label="Navigation principale"
      >
        {/* En-tête : Logo & App Name */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 border-b border-slate-800/80 px-4">
          <div className="relative w-28 h-28 mb-3 drop-shadow-md transition-transform hover:scale-105 duration-300">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-semibold tracking-widest text-slate-400 uppercase">
            Administration
          </span>
        </div>

        {/* Menu déroulant principal */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 custom-scrollbar">
          {/* Bouton Accueil */}
          <div>
            <Link
              href="/home"
              onClick={() => isMobile && setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-md font-medium transition-all duration-200",
                pathname === "/home"
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <FontAwesomeIcon icon={faHouse} className="w-4 h-4 text-amber-400" />
              <span>Accueil</span>
            </Link>
          </div>

          {/* Section Titre */}
          <div className="space-y-3">
            <h2 className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              Menu Général
            </h2>

            {/* Inscription des sections dynamiques */}
            <nav className="space-y-2">
              {ItemAside.map((aside, sectionIndex) => {
                const isExpanded = toggleAsideSections.includes(sectionIndex);
                const sectionBadgeCount = getSectionNotificationsCount(sectionIndex);

                return (
                  <div key={sectionIndex} className="rounded-lg overflow-hidden bg-slate-950/40 border border-slate-800/40">
                    {/* Header de la section */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sectionIndex)}
                      className="w-full flex items-center justify-between px-3.5 py-3 text-md font-semibold text-slate-200 hover:bg-slate-800/70 transition-colors"
                    >
                      <span className="truncate">{aside.title}</span>
                      <div className="flex items-center gap-2">
                        {sectionBadgeCount > 0 && (
                          <span className="px-2 py-0.5 text-xs relative left-2 font-bold bg-red-500 text-white rounded-full animate-pulse">
                            {sectionBadgeCount}
                          </span>
                        )}
                        <FontAwesomeIcon
                          icon={isExpanded ? faChevronUp : faChevronDown}
                          className="w-3 h-3 text-slate-400 transition-transform duration-200"
                        />
                      </div>
                    </button>

                    {/* Sous-items avec animation de hauteur CSS */}
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100 py-1" : "grid-rows-[0fr] opacity-0 py-0"
                      )}
                    >
                      <div className="overflow-hidden space-y-1 pl-3 pr-2">
                        {aside.ItemLists.map((list, pageIndex) => {
                          const isActive = pathname === list.href;
                          const pageBadgeCount = getPageNotificationsCount(pageIndex);
                          const hasNotification = storedNotificationsArray.some(
                            (item) =>
                              Number(item.adminPageIndex) === pageIndex &&
                              Number(item.adminSectionIndex) === sectionIndex
                          );

                          return (
                            <Link
                              key={pageIndex}
                              href={list.access ? list.href : "/home"}
                              onClick={() => {
                                if (!list.access) {
                                  return Swal.fire({
                                    icon:'info',
                                    title: "Violation d'accès",
                                    text: "Vous n'avez aucun droit d'accéder à cette. Veuillez contacter votre administrateur"
                                  })
                                }
                                if (isMobile) setIsOpen(false);
                                if (sectionIndex !== 0 || pageIndex !== 0) {
                                  const filtered = storedNotificationsArray.filter(
                                    (item) =>
                                      item.adminPageIndex !== pageIndex.toString() ||
                                      item.adminSectionIndex !== sectionIndex.toString()
                                  );
                                  setStoredNotificationsArray(filtered);
                                  localStorage.setItem("storedNotificationsArray", JSON.stringify(filtered));
                                }
                              }}
                              className={cn(
                                "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all duration-150",
                                isActive
                                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
                              )}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {list.icon && <FontAwesomeIcon icon={list.icon} className="w-3.5 h-3.5" />}
                                <span className="truncate">{list.title}</span>
                              </div>

                              {hasNotification && pageBadgeCount > 0 && (
                                <span className={cn(
                                  "px-2.5 py-0.5 text-[10px] relative left-2 font-bold rounded-full",
                                  isActive ? "bg-red-500 text-white" : "bg-red-500 text-white"
                                )}>
                                  {pageBadgeCount}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Footer : Informations de session utilisateur */}
        {session?.user && (
          <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
              {/* {session.user.image ? (
                <Image
                  src={`${providers.APIUrl}/${session.user.image}`}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <FontAwesomeIcon icon={faUserCircle} className="w-6 h-6 text-slate-400" />
              )} */}
            </div>

            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-slate-100 truncate">
                {(session.user as any)?.firstname} {(session.user as any)?.lastname}
              </span>
              <span className="text-[10px] font-medium text-amber-400/90 truncate">
                {(session.user as any)?.role}
              </span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}