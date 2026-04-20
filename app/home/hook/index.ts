"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCity,
  faDollar,
  faDollarSign,
  faGlobe,
  faHandHoldingDollar,
  faUserGroup,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";

type Attendances = {
  status: string;
  arrivalTime: string;
  Salary: {
    dailySalary: string;
  };
  EnterpriseId: number | null;

  mounth: number;

  Planning: {
    startTime: string,
  },

  Enterprise: {
    toleranceTime: null,
    maxToleranceTime: null,
    pourcentageOfHourlyDeduction: null,
    maxPourcentageOfHourlyDeduction: null
  }
};

export default function HomeComponent() {
  const [attendances, setAttendances] = useState<Attendances[]>([]);
  const [EnterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [enterprise, setEnterprise] = useState({
    subscriptionStatus: "",
    subscriptionType: ""
  })
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
      // const toleranceTime = Number(attendance?.Enterprise?.toleranceTime) ?? 0;
      // const maxToleranceTime = Number(attendance?.Enterprise?.maxToleranceTime) ?? 0;
      // const pourcentageOfHourlyDeduction = parseFloat(String(attendance?.Enterprise?.pourcentageOfHourlyDeduction));
      // const maxPourcentageOfHourlyDeduction = parseFloat(String(attendance?.Enterprise?.maxPourcentageOfHourlyDeduction ?? ""));

      // const pourcent = pourcentageOfHourlyDeduction / 100;
      // const maxPourcent = maxPourcentageOfHourlyDeduction / 100;
      // const dailySalary = parseInt(attendance?.Salary?.dailySalary ?? 0);

      // if ((status === "En retard" && arrivalTime > toleranceTime) && (arrivalTime < maxToleranceTime)) {
      //   totalLates += dailySalary * pourcent;
      // } else if (status === "En retard" && arrivalTime > maxToleranceTime) {
      //   totalLates += dailySalary * maxPourcent;
      // }
      // else if (attendance.status === "Absent") {
      //   totalAbsences += dailySalary;
      // }
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
      }
    }
    return totalLates + totalAbsences;
  }

  useEffect(() => {
    (async () => {
      if (typeof (window) === "undefined") return;
      const users = await providers.API.getAll(providers.APIUrl, "getUsers", null);
      const EnterpriseId = window.localStorage.getItem("EnterpriseId");
      const UserId = localStorage.getItem("id");
      const fcmToken = localStorage.getItem('adminFcmToken');
      setEnterpriseId(EnterpriseId);
      if (parseInt(EnterpriseId ?? "") !== 1) {
        const filterUsersByEnterprisesId = users.filter((user: { EnterpriseId: number }) => user.EnterpriseId === parseInt(EnterpriseId ?? ""));
        return setData({
          ...data,
          usersArray: filterUsersByEnterprisesId
        })
      }
      setData({
        ...data,
        usersArray: users
      })
      const fcmTokenResponse = await providers.API.post(providers.APIUrl, "sendFcmToken", null, {
        id: Number(UserId),
        UserEnterpriseId: Number(EnterpriseId),
        fcmToken
      });
      console.log(fcmTokenResponse)

    })()
  }, []);

  useEffect(() => {
    (async () => {
      const enterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
      setData({
        ...data,
        enterprisesArray: enterprises
      })
    })()
  }, [data.usersArray]);

  useEffect(() => {
    (async () => {
      const attendances = await providers.API.getAll(providers.APIUrl, "getAllAttendances", null);
      if (parseInt(EnterpriseId ?? "") !== 1) {
        const filterAttendancesByEnterpriseId = attendances.filter((attendance: { EnterpriseId: number, mounth: number, createdAt: string }) => attendance.EnterpriseId === parseInt(EnterpriseId ?? "") && attendance.mounth === monthValue && new Date(attendance.createdAt).getFullYear() === new Date().getFullYear());
        return setAttendances(filterAttendancesByEnterpriseId);
      }
      const filterAttendancesByEnterpriseId = attendances.filter((attendance: { EnterpriseId: number, mounth: number, createdAt: string }) => [1, 2, 3, 4].includes(attendance.EnterpriseId) && attendance.mounth === monthValue && new Date(attendance.createdAt).getFullYear() === new Date().getFullYear());
      return setAttendances(filterAttendancesByEnterpriseId);
    })()
  }, [data.enterprisesArray]);

  useEffect(() => {
    (async () => {
      const EnterpriseId = localStorage.getItem("EnterpriseId");
      const enterprise = await providers.API.getOne(providers.APIUrl, 'getEnterprise', Number(EnterpriseId));

      setEnterprise({
        subscriptionStatus: enterprise?.subscriptionStatus,
        subscriptionType: enterprise?.subscriptionType
      })
    })()
  }, [attendances])

  const cardComponent = [
    {
      icon: faUsers,
      backgroundColor: "#6366f1",
      path: "/dashboard/RH/usersList",
      title: "Collaborateurs",
      value: data.usersArray?.length || 0
    },
    {
      icon: faBuilding,
      backgroundColor: "#0ea5e9",
      path: "/dashboard/OTHERS/enterprisesList",
      title: "Entreprises",
      value: data.enterprisesArray?.length || 0
    },
    {
      icon: faHandHoldingDollar,
      backgroundColor: "#fb923c",
      path: "/dashboard/STATS/annualGain",
      title: "Gain mensuel actuel (FCFA)",
      value: getTotalAttendanceDeductions(attendances)
    }
  ];

  return { cardComponent, enterprise }
}
