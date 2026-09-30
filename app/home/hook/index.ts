"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  faBuilding,
  faHandHoldingDollar,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { AttendanceListDto, AttendanceSingleResponseDto, AttendancesResponseDto, Enterprise, EnterprisesResponseDto, User, UsersResponseDto } from "@/types/global";

type Attendances = {
  status: string;
  arrivalTime: string;
  departureTime: string | null;
  Salary: {
    dailySalary: string;
  };
  EnterpriseId: number | null;
  mounth: number;
  Planning: {
    startTime: string;
  };
  Enterprise: {
    toleranceTime: null;
    maxToleranceTime: null;
    pourcentageOfHourlyDeduction: null;
    maxPourcentageOfHourlyDeduction: null;
  };
};

type Data = {
  usersArray: User[],
  enterprisesArray: Enterprise[],
  totalAmount: [],
  countriesArray: [],
  citiesArray: [],
}

export default function HomeComponent() {
  const { data: session, status } = useSession();
  const [attendances, setAttendances] = useState<AttendanceListDto[]>([]);
  const [enterprise, setEnterprise] = useState({
    subscriptionStatus: "",
    subscriptionType: "",
  });
  const [loader, setLoader] = useState(true);
  const monthValue = new Date().getMonth();

  const [data, setData] = useState<Data>({
    usersArray: [],
    enterprisesArray: [],
    totalAmount: [],
    countriesArray: [],
    citiesArray: [],
  });

  function getTotalAttendanceDeductions(attendances: AttendanceListDto[]) {
    let totalLates: number = 0;
    let totalAbsences: number = 0;

    for (const attendance of attendances) {
      const status = attendance.status;
      const minutes = attendance.arrivalTime.split(":")?.pop() || "0";
      const finalMinutes = Number(minutes);
      let deductionAmount = 0;
      const finalDailySalary = Number(attendance?.Salary?.dailySalary) || 0;

      if (status === "En retard" && finalMinutes <= 15) {
        deductionAmount = Math.round(0.1 * finalDailySalary);
        totalLates += deductionAmount;
      } else if (status === "En retard" && finalMinutes > 15 && finalMinutes <= 30) {
        deductionAmount = Math.round(0.15 * finalDailySalary);
        totalLates += deductionAmount;
      } else if (status === "En retard" && finalMinutes > 30) {
        deductionAmount = Math.round(0.5 * finalDailySalary);
        totalLates += deductionAmount;
      } else if (status === "Absent") {
        totalAbsences += finalDailySalary;
      } else if (status === "A temps" && !attendance.departureTime) {
        deductionAmount = Math.round(0.1 * finalDailySalary);
        totalLates += deductionAmount;
      }
    }
    return totalLates + totalAbsences;
  }

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;

    const userEnterpriseId = Number((session.user as any).EnterpriseId);
    const userId = Number(session.user.id);
    const MainEnterpriseId = Number((session.user as any).MainEnterpriseId);
    const adminRole = (session.user as any).adminRole;

    (async () => {
      try {
        setLoader(true);
        const users = await providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null);
       
        let filteredUsers: User[] = users.data;
      
        if (adminRole !== "Super_Admin_Platform" && adminRole !== "Super_Admin_Enterprise") {
          filteredUsers = users.data.filter(
            (u: { EnterpriseId: number }) => u.EnterpriseId === userEnterpriseId
          );
        } else if (adminRole === "Super_Admin_Enterprise") {
          filteredUsers = users.data.filter(u => u.MainEnterpriseId === MainEnterpriseId
          );
        }

        const enterprises = await providers.API.getAll<EnterprisesResponseDto>(
          providers.APIUrl,
          "enterprises",
          null
        );

        let filteredEnterprises: Enterprise[] = enterprises.data

        if (adminRole === "Super_Admin_Enterprise") {
          filteredEnterprises.filter(item => item.MainEnterpriseId === MainEnterpriseId)
        }

        setData((prevData) => ({
          ...prevData,
          usersArray: filteredUsers,
          enterprisesArray: filteredEnterprises,
        }));

        const fcmToken = localStorage.getItem("adminFcmToken");
    
        if (fcmToken) {
          const res = await providers.API.update(
            providers.APIUrl,
            "fcm-tokens",
            null,
            {
              UserId: userId,
              UserEnterpriseId: userEnterpriseId,
              fcmToken,
            },
            null
          );
        }

        const allAttendances = await providers.API.getAll<AttendancesResponseDto>(
          providers.APIUrl,
          "attendances",
          null
        );

        const currentYear = new Date().getFullYear();
        let filteredAttendances: AttendanceListDto[] = allAttendances.data;

        if (adminRole === "Super_Admin_Platform") {
          filteredAttendances = allAttendances.data.filter(
            (a: { EnterpriseId: number; mounth: number; createdAt: string }) =>
              a.EnterpriseId === userEnterpriseId &&
              a.mounth === monthValue &&
              new Date(a.createdAt).getFullYear() === currentYear
          );
        } else if (adminRole === "Super_Admin_Enterprise") {
          filteredAttendances = allAttendances.data.filter(a =>
            a.Enterprise.MainEnterpriseId === MainEnterpriseId &&
            a.mounth === monthValue &&
            new Date(a.createdAt).getFullYear() === currentYear
          );
        }

        setAttendances(filteredAttendances);

        if (userEnterpriseId) {
          const enterpriseRes = await providers.API.getOne<AttendanceSingleResponseDto>(
            providers.APIUrl,
            "enterprises",
            userEnterpriseId
          );

          setEnterprise({
            subscriptionStatus: enterpriseRes?.data.subscriptionStatus,
            subscriptionType: enterpriseRes?.data.subscriptionType,
          });
        }
      } catch (error) {
        console.error("Erreur de chargement des données :", error);
      } finally {
        setLoader(false);
      }
    })();
  }, [status, session, monthValue]);

  const cardComponent = [
    {
      icon: faUsers,
      backgroundColor: "#6366f1",
      path: "/dashboard/RH/users",
      title: "Collaborateurs",
      value: data.usersArray?.length || 0,
    },
    {
      icon: faBuilding,
      backgroundColor: "#0ea5e9",
      path: "/dashboard/OTHERS/enterprise/list",
      title: "Entreprises",
      value: data.enterprisesArray?.length || 0,
    },
    {
      icon: faHandHoldingDollar,
      backgroundColor: "#fb923c",
      path: "/home/#home",
      title: "Gain mensuel actuel (FCFA)",
      value: getTotalAttendanceDeductions(attendances),
    },
  ];

  return { cardComponent, enterprise, loader };
}