"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  faBuilding,
  faHandHoldingDollar,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";

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

export default function HomeComponent() {
  const { data: session, status } = useSession();
  const [attendances, setAttendances] = useState<Attendances[]>([]);
  const [enterprise, setEnterprise] = useState({
    subscriptionStatus: "",
    subscriptionType: "",
  });
  const [loader, setLoader] = useState(true);
  const monthValue = new Date().getMonth();

  const [data, setData] = useState({
    usersArray: [],
    enterprisesArray: [],
    totalAmount: [],
    countriesArray: [],
    citiesArray: [],
  });

  function getTotalAttendanceDeductions(attendances: Attendances[]) {
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
        const users = await providers.API.getAll(providers.APIUrl, "getUsers", null);
        let filteredUsers = users;

        if (adminRole !== "Super_Admin_Platform" && adminRole !== "Super_Admin_Enterprise") {
          filteredUsers = users.filter(
            (u: { EnterpriseId: number }) => u.EnterpriseId === userEnterpriseId
          );
        } else if (adminRole === "Super_Admin_Enterprise") {
          filteredUsers = users.filter(
            (u: { Enterprise: { MainEnterpriseId: number } }) => u.Enterprise.MainEnterpriseId === MainEnterpriseId
          );
        }

        const enterprises = await providers.API.getAll(
          "https://vps118934.serveur-vps.net:4001",
          "getEnterprises",
          null
        );

        let filteredEnterprises = enterprises

        if (adminRole === "Super_Admin_Enterprise") {
          filteredEnterprises.filter((item: { MainEnterpriseId: number }) => item.MainEnterpriseId === MainEnterpriseId)
        }

        setData((prevData) => ({
          ...prevData,
          usersArray: filteredUsers,
          enterprisesArray: filteredEnterprises,
        }));

        const fcmToken = localStorage.getItem("adminFcmToken");
        console.log("le token fcm", fcmToken)
        if (fcmToken) {
          const res = await providers.API.post(
            "https://vps118934.serveur-vps.net:4001",
            "sendFcmToken",
            null,
            {
              UserId: userId,
              UserEnterpriseId: userEnterpriseId,
              fcmToken,
            }
          );
          console.log(res)
        }

        const allAttendances = await providers.API.getAll(
          providers.APIUrl,
          "getAllAttendances",
          null
        );

        const currentYear = new Date().getFullYear();
        let filteredAttendances = [];

        if (adminRole === "Super_Admin_Platform") {
          filteredAttendances = allAttendances.filter(
            (a: { EnterpriseId: number; mounth: number; createdAt: string }) =>
              a.EnterpriseId === userEnterpriseId &&
              a.mounth === monthValue &&
              new Date(a.createdAt).getFullYear() === currentYear
          );
        } else if (adminRole === "Super_Admin_Enterprise") {
          filteredAttendances = allAttendances.filter(
            (a: { Enterprise: { MainEnterpriseId: number }; mounth: number; createdAt: string }) =>
              a.Enterprise.MainEnterpriseId === MainEnterpriseId &&
              a.mounth === monthValue &&
              new Date(a.createdAt).getFullYear() === currentYear
          );
        }

        setAttendances(filteredAttendances);

        if (userEnterpriseId) {
          const enterpriseRes = await providers.API.getOne(
            "https://vps118934.serveur-vps.net:4001",
            "getEnterprise",
            userEnterpriseId
          );

          setEnterprise({
            subscriptionStatus: enterpriseRes?.subscriptionStatus,
            subscriptionType: enterpriseRes?.subscriptionType,
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