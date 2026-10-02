"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faHouse } from "@fortawesome/free-solid-svg-icons";

import { cn } from "@/lib/utils";
import socket from "@/socket";
import { providers } from "@/index";
import { useSidebarContext } from "./sidebar-context";
import { SidebarHook } from "./hook";
import Swal from "sweetalert2";

function getInitials(firstname?: string, lastname?: string) {
  const f = firstname?.trim()?.[0] ?? "";
  const l = lastname?.trim()?.[0] ?? "";
  return (f + l).toUpperCase() || "A";
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { setIsOpen, isOpen, isMobile } = useSidebarContext();
  const [toggleAsideSections, setToggleAsideSections] = useState<number[]>([]);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const {
    ItemAside,
    getPageNotificationsCount,
    getSectionNotificationsCount,
    storedNotificationsArray,
    setStoredNotificationsArray,
  } = SidebarHook();

  // -------------------------------------------------------------
  // Initialisation de la Socket avec les données de Session
  // -------------------------------------------------------------
  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const user = session.user;
    const userIdNumber = Number(user.id);
    socket.emit("register", userIdNumber);
  }, [session, status]);

  // -------------------------------------------------------------
  // Auto-ouverture de la section active selon l'URL
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
  // Fermeture automatique sur mobile
  // -------------------------------------------------------------
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [isMobile, setIsOpen]);

  const handleToggleSection = (index: number) => {
    setToggleAsideSections((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const user = session?.user as any;

  return (
    <>
      {/* Overlay mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "relative z-50 flex flex-col overflow-hidden border-r border-white/5 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-slate-200 shadow-2xl shadow-black/30 transition-all duration-300 ease-in-out",
          isMobile ? "fixed inset-y-0 left-0 w-[280px]" : "sticky top-0 h-screen w-[280px]",
          !isOpen && (isMobile ? "-translate-x-full" : "hidden")
        )}
        aria-label="Navigation principale"
      >
        {/* Halo ambré en haut de la barre */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl"
        />

        {/* En-tête : logo */}
        <div className="relative flex flex-col items-center px-4 pb-6 pt-8">
          <div className="relative mb-3 h-24 w-24 rounded-3xl bg-white/[0.04] p-3 ring-1 ring-white/10 shadow-lg shadow-black/20 transition-transform duration-300 hover:scale-105">
            <Image
              src="/images/logo.png"
              alt="Logo"
              fill
              sizes="96px"
              className="object-contain p-3"
              priority
            />
          </div>
          <span className="text-sm font-medium tracking-wide text-slate-400">
            Administration
          </span>
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
          />
        </div>

        {/* Navigation */}
        <div className="custom-scrollbar relative flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {/* Accueil */}
          <Link
            href="/home"
            onClick={() => isMobile && setIsOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
              pathname === "/home"
                ? "bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 ring-1 ring-amber-500/25"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                pathname === "/home"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-white/5 text-amber-400 group-hover:bg-white/10"
              )}
            >
              <FontAwesomeIcon icon={faHouse} className="h-3.5 w-3.5" />
            </span>
            <span>Accueil</span>
          </Link>

          {/* Menu général */}
          <div className="space-y-3">
            <h2 className="px-3 text-xs font-semibold text-slate-500">Menu général</h2>

            <nav className="space-y-1.5">
              {ItemAside.map((aside, sectionIndex) => {
                const isExpanded = toggleAsideSections.includes(sectionIndex);
                const sectionBadgeCount = getSectionNotificationsCount(sectionIndex);
                const hasActiveChild = aside.ItemLists.some((item) => item.href === pathname);

                return (
                  <div key={sectionIndex}>
                    {/* En-tête de section */}
                    <button
                      type="button"
                      onClick={() => handleToggleSection(sectionIndex)}
                      aria-expanded={isExpanded}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
                        isExpanded || hasActiveChild
                          ? "text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                            hasActiveChild ? "bg-amber-400" : "bg-slate-600"
                          )}
                        />
                        <span className="truncate">{aside.title}</span>
                      </span>

                      <span className="flex items-center gap-2.5">
                        {sectionBadgeCount > 0 && (
                          <span className="min-w-[22px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[11px] font-bold leading-none text-white shadow-md shadow-red-500/30 ring-2 ring-slate-900 motion-safe:animate-pulse">
                            {sectionBadgeCount}
                          </span>
                        )}
                        <FontAwesomeIcon
                          icon={faChevronDown}
                          className={cn(
                            "h-3 w-3 text-slate-500 transition-transform duration-300",
                            isExpanded && "rotate-180 text-slate-300"
                          )}
                        />
                      </span>
                    </button>

                    {/* Sous-éléments */}
                    <div
                      className={cn(
                        "grid transition-all duration-300 ease-in-out",
                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      )}
                    >
                      <div className="overflow-hidden">
                        {/* Ligne verticale : encode la hiérarchie parent / enfant */}
                        <div className="ml-[1.1rem] mt-1 space-y-0.5 border-l border-white/10 pb-1 pl-3">
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
                                tabIndex={isExpanded ? 0 : -1}
                                onClick={() => {
                                  if (!list.access) {
                                    return Swal.fire({
                                      icon: "info",
                                      title: "Accès refusé",
                                      text: "Vous n'avez pas les droits pour accéder à cette page. Veuillez contacter votre administrateur.",
                                    });
                                  }
                                  if (isMobile) setIsOpen(false);
                                  if (sectionIndex !== 0 || pageIndex !== 0) {
                                    const filtered = storedNotificationsArray.filter(
                                      (item) =>
                                        item.adminPageIndex !== pageIndex.toString() ||
                                        item.adminSectionIndex !== sectionIndex.toString()
                                    );
                                    setStoredNotificationsArray(filtered);
                                    localStorage.setItem(
                                      "storedNotificationsArray",
                                      JSON.stringify(filtered)
                                    );
                                  }
                                }}
                                className={cn(
                                  "group relative flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60",
                                  isActive
                                    ? "bg-gradient-to-r from-amber-400 to-amber-500 font-semibold text-slate-950 shadow-lg shadow-amber-500/20"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                )}
                              >
                                {/* Repère sur la ligne verticale pour la page active */}
                                {isActive && (
                                  <span
                                    aria-hidden
                                    className="absolute -left-[13px] top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-amber-400"
                                  />
                                )}

                                <span className="flex min-w-0 items-center gap-2.5">
                                  {list.icon && (
                                    <FontAwesomeIcon
                                      icon={list.icon}
                                      className={cn(
                                        "h-3.5 w-3.5 shrink-0 transition-colors",
                                        isActive
                                          ? "text-slate-950"
                                          : "text-slate-500 group-hover:text-amber-400"
                                      )}
                                    />
                                  )}
                                  <span className="truncate">{list.title}</span>
                                </span>

                                {hasNotification && pageBadgeCount > 0 && (
                                  <span className="ml-2 min-w-[20px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-sm ring-2 ring-slate-900">
                                    {pageBadgeCount}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Pied : session utilisateur */}
        {user && (
          <div className="relative border-t border-white/5 bg-black/20 p-4 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/5">
              <div className="relative shrink-0">
                <div className="rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 p-[2px]">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-900 ring-2 ring-slate-900">
                    {user.image && !avatarFailed ? (
                      <img
                        src={`${providers.APIUrl}/${user.image}`}
                        alt={`Photo de ${user.firstname ?? ""} ${user.lastname ?? ""}`.trim()}
                        className="h-full w-full object-cover"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span className="text-xs font-semibold text-amber-300">
                        {getInitials(user.firstname, user.lastname)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 bg-emerald-500" />
              </div>

              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-slate-100">
                  {user.firstname} {user.lastname}
                </span>
                <span className="truncate text-xs text-amber-400/90">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
