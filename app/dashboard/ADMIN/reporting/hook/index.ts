"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import HookComponentModal from "@/components/ComponentModal";
import { SidebarHook } from "@/components/Layouts/sidebar/hook";

// --- TYPES ---
export type UserInfo = {
  firstname: string;
  lastname: string;
  email: string;
  photo: string;
};

export type RepportsValue = {
  id: number;
  title: string;
  content: string;
  files: string;
  UserId: number;
  EnterpriseId: number;
  monthIndice: number;
  createdAt: string;
  adminResponse: string;
  User: UserInfo;
};

export type AdminComment = {
  id?: number;
  UserId: number;
  RepportId: number;
  content: string;
};

const MONTHS_OF_YEAR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export function RepportsListHook() {
  // --- SESSION & HOOKS ---
  const { data: session, status: sessionStatus } = useSession();
  const ComponentModal = HookComponentModal();
  const { setStoredNotificationsArray } = SidebarHook();

  // --- STATES ---
  const [itemIndex, setItemIndex] = useState<number | null>(null);
  const [itemIndexOnWriting, setItemIndexOnWriting] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [adminResponse, setAdminResponse] = useState<string>("");
  const [monthIndice, setMonthIndice] = useState<number>(new Date().getMonth());
  const [repportsArray, setRepportsArray] = useState<RepportsValue[]>([]);
  const [repportsArrayCloned, setRepportsArrayCloned] = useState<RepportsValue[]>([]);
  const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminReportCommentArray, setAdminReportCommentArray] = useState<AdminComment[]>([]);
  const [loader, setLoader] = useState<boolean>(true);

  // --- API HANDLERS ---
  const getAdminResponse = useCallback(async () => {
    try {
      const comments = await providers.API.getAll(
        providers.APIUrl,
        "getAdminReportComment",
        null
      );
      setAdminReportCommentArray(comments || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires admin:", error);
    }
  }, []);

  // --- EFFECTS ---

  // 1. Synchronisation de la session (EnterpriseId) et chargement initial des rapports
  useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user) {
      // Récupération depuis la session au lieu du localStorage
      //
      const user = session.user as typeof session.user & { EnterpriseId?: number | string | null };

      const userEnterpriseId = user.EnterpriseId
        ? String(user.EnterpriseId)
        : null;

      setEnterpriseId(userEnterpriseId);
    }

    const modalData = ComponentModal?.at(0)?.Repport?.repportsArray ?? [];
    setRepportsArray(modalData);
    setRepportsArrayCloned(modalData);

    getAdminResponse();
  }, [session, sessionStatus, ComponentModal, getAdminResponse]);

  // 2. Gestion du Loader d'attente
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoader(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [repportsArray]);

  // --- FILTERS & NAVIGATION ---
  const navigateBetweenMonths = useCallback(
    (repportArray: RepportsValue[], targetMonthIndice: number, targetEnterpriseId: number) => {
      const filteredReports = repportArray.filter(
        (repport) =>
          repport.EnterpriseId === targetEnterpriseId &&
          repport.monthIndice === targetMonthIndice
      );
      setRepportsArrayCloned(filteredReports);
    },
    []
  );

  const filterRepportsByUsersNames = useCallback(
    (value: string, targetMonthIndice: number) => {
      const query = value.toLowerCase().trim();
      const filtered = repportsArray.filter((report) => {
        const lastname = report.User?.lastname?.toLowerCase() || "";
        const firstname = report.User?.firstname?.toLowerCase() || "";
        const reportMonth = new Date(report.createdAt).getMonth();

        const matchesMonth = targetMonthIndice === reportMonth;
        const matchesName = firstname.includes(query) || lastname.includes(query);

        return matchesMonth && matchesName;
      });

      setRepportsArrayCloned(filtered);
    },
    [repportsArray]
  );

  // --- ACTIONS ---
  const adminReportComment = useCallback(
    async (content: string, repportId: number, email: string, userId: number) => {
      setIsLoading(true);

      if (!content.trim()) {
        setIsLoading(false);
        return providers.alertMessage(
          false,
          "Champ invalide",
          "Veuillez saisir un commentaire",
          null
        );
      }

      try {
        const response = await providers.API.post(
          providers.APIUrl,
          "addAdminReportComment",
          null,
          {
            UserId: userId,
            content,
            RepportId: repportId,
          }
        );

        if (response?.status) {
          setAdminResponse("");
          await getAdminResponse(); // Rafraîchit les données après ajout
        }
      } catch (error) {
        console.error("Erreur lors de l'envoi du commentaire:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [getAdminResponse]
  );

  return {
    // Session State
    session,
    sessionUserId: session?.user?.id ?? null,
    EnterpriseId: enterpriseId,

    // Component States
    itemIndex,
    setItemIndex,
    itemIndexOnWriting,
    setItemIndexOnWriting,
    isVisible,
    setIsVisible,
    adminResponse,
    setAdminResponse,
    monthIndice,
    setMonthIndice,
    isLoading,
    setIsLoading,
    loader,

    // Data & Collections
    RepportsArray: repportsArray,
    repportsArrayCloned,
    adminReportCommentArray,
    monthsOfYear: MONTHS_OF_YEAR,
    ComponentModal,

    // Methods
    filterRepportsByUsersNames,
    navigateBetweenMonths,
    adminReportComment,
    getAdminResponse,
  };
}