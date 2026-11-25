"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { APIUrl, providers } from "@/index";
import HookComponentModal from "@/components/ComponentModal";
import { SidebarHook } from "@/components/Layouts/sidebar/hook";
import { Report, ReportResponseDto, ReportsResponseDto } from "@/types/global";
import { useToast } from "@/components/toast";

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
  const [repportsArray, setRepportsArray] = useState<Report[]>([]);
  const [repportsArrayCloned, setRepportsArrayCloned] = useState<Report[]>([]);
  const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminReportCommentArray, setAdminReportCommentArray] = useState<Report[]>([]);
  const [loader, setLoader] = useState<boolean>(true);
  const [adminId, setAdminId] = useState<number | null>(null);
  const toast = useToast()
  // --- API HANDLERS ---
  const getAdminResponse = useCallback(async () => {
    try {
      const comments = await providers.API.getAll<ReportsResponseDto>(
        providers.APIUrl,
        "reports/comments",
        null
      );
      setAdminReportCommentArray(comments.data || []);
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires admin:", error);
    }
  }, []);

  // --- EFFECTS ---

  useEffect(() => {
    (async () => {
      try {
        if (!session?.user) return;

        const user = session.user as typeof session.user & { EnterpriseId?: number | string | null };
        const adminEnterpriseId = user.EnterpriseId
          ? String(user.EnterpriseId)
          : null;
        const adminId = Number(user.id)
        const res = (await providers.API.getAll<ReportsResponseDto>(APIUrl, "reports", null)).data;
        console.log(res)
        const filteredReportsByEnterpriseId = res.filter(r => r.Enterprise?.MainEnterpriseId === Number(adminEnterpriseId))

        setRepportsArray(filteredReportsByEnterpriseId);
        setRepportsArrayCloned(filteredReportsByEnterpriseId);
        setEnterpriseId(adminEnterpriseId);
        setAdminId(adminId);
        getAdminResponse();
      } catch (error) {
        console.log(error)
      }
      finally {
        setLoader(false)
      }

    })();

  }, [session, getAdminResponse]);

  // --- FILTERS & NAVIGATION ---
  const navigateBetweenMonths = useCallback(
    (repportArray: Report[], targetMonthIndice: number, targetEnterpriseId: number) => {
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
        toast.error("Champ invalide",
          "Veuillez saisir un commentaire",
        )
      }

      try {
        await providers.API.post(
          providers.APIUrl,
          "reports/comments",
          null,
          {
            UserId: userId,
            content,
            RepportId: repportId,
          }
        );

        setAdminResponse("");
        await getAdminResponse();
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
    adminId,
    RepportsArray: repportsArray,
    repportsArrayCloned,
    adminReportCommentArray,
    monthsOfYear: MONTHS_OF_YEAR,
    ComponentModal,
    filterRepportsByUsersNames,
    navigateBetweenMonths,
    adminReportComment,
    getAdminResponse,
  };
}