"use client";
import { providers } from "@/index";
import { useEffect, useState } from "react";

type Attendances = {
    status: string,
    arrivalTime: string;
    Salary: { dailySalary: string, netSalary: string },
    EnterpriseId: number | null,
    mounth: number,
    UserId: number,
    createdAt: string,
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

type Users = {
    EnterpriseId: number,
    Salary: {
        dailySalary: string | null
    }
}[];

export function AnnualGainHook() {
    const [totalDeductionByMonth, setTotalDeductionByMonth] = useState(0);
    const [attendances, setAttendances] = useState<Attendances[]>([]);
    const [EnterpriseId, setEnterpriseId] = useState<string | null>(null);
    const [adminRole, setAdminRole] = useState<string | null>(null);
    const [MonthlyLimit, setMonthlyLimit] = useState(0);

    function getDuductionByMonth(attendances: Attendances[], monthIndice: number) {
        const fullYear = new Date().getFullYear();

        const filterAttendanceByMonth = attendances.filter(a => a.mounth === monthIndice && new Date(a.createdAt).getFullYear() === fullYear);

        let totalLates = 0;
        let totalAbsences = 0;

        for (const attendance of filterAttendanceByMonth) {
            const status = attendance.status;
            const minutes = parseInt(attendance.arrivalTime.split(":")?.pop() ?? "");
            const finalMinutes = Number(minutes);
            const finalDailySalary = Number(attendance?.Salary?.dailySalary) || 0
            let deductionAmount = 0;

            // const arrivalTimeMinutes = Number(attendance?.arrivalTime.split(":")?.pop() || 0);
            // const toleranceTime = Number(attendance?.Enterprise?.toleranceTime || 0);
            // const maxToleranceTime = Number(attendance?.Enterprise?.maxToleranceTime || 0);
            // const pourcentageOfHourlyDeduction = parseFloat(attendance?.Enterprise?.pourcentageOfHourlyDeduction ?? "") || 0;
            // const maxPourcentageOfHourlyDeduction = parseFloat(attendance?.Enterprise?.maxPourcentageOfHourlyDeduction ?? "") || 0;

            // const pourcent = pourcentageOfHourlyDeduction / 100;
            // const maxPourcent = maxPourcentageOfHourlyDeduction / 100;
            // const dailySalary = Number(attendance.Salary?.dailySalary ?? 0);

            // if ((status === "En retard" && arrivalTimeMinutes > toleranceTime) && (arrivalTimeMinutes < maxToleranceTime)) {
            //     totalLates += dailySalary * pourcent;
            // } else if (status === "En retard" && arrivalTimeMinutes > maxToleranceTime) {
            //     totalLates += dailySalary * maxPourcent;
            // }
            // else if (attendance.status === "Absent") {
            //     totalAbsences += dailySalary;
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
    };

    const monthlyBalances = [
        { month: "Jan", value: getDuductionByMonth(attendances, 0) },
        { month: "Fev", value: getDuductionByMonth(attendances, 1) },
        { month: "Mar", value: getDuductionByMonth(attendances, 2) },
        { month: "Avr", value: getDuductionByMonth(attendances, 3) },
        { month: "Mai", value: getDuductionByMonth(attendances, 4) },
        { month: "Juin", value: getDuductionByMonth(attendances, 5) },
        { month: "Jul", value: getDuductionByMonth(attendances, 6) },
        { month: "Aug", value: getDuductionByMonth(attendances, 7) },
        { month: "Sep", value: getDuductionByMonth(attendances, 8) },
        { month: "Oct", value: getDuductionByMonth(attendances, 9) },
        { month: "Nov", value: getDuductionByMonth(attendances, 10) },
        { month: "Dec", value: getDuductionByMonth(attendances, 11) },
    ];

    //Récuoération de toutes les horaires et filtrage en fonction de l'entreprise
    useEffect(() => {
        (async () => {
            const EnterpriseId = window?.localStorage.getItem("EnterpriseId");
            const adminRole = window?.localStorage.getItem("adminRole");

            const attendances = await providers.API.getAll(providers.APIUrl, "getAllAttendances", null);
            const filtered = Number(EnterpriseId) !== 1
                ? attendances.filter((a: { EnterpriseId: number }) => a.EnterpriseId === parseInt(EnterpriseId ?? ""))
                : attendances.filter((a: { EnterpriseId: number }) => [1, 2, 3, 4, null].includes(a.EnterpriseId));
            setAttendances(filtered);
            setEnterpriseId(EnterpriseId);
            setAdminRole(adminRole);
        })();
    }, []);

    //Récupération et filtrage des utilisateurs en fonction de l'entreprise
    useEffect(() => {
        (async () => {
            let total = 0;
            const users: Users = await providers.API.getAll(providers.APIUrl, "getUsers", null);

            const usersByEnterprisesId: Users = Number(EnterpriseId) !== 1 ?
                users.filter(user => user.EnterpriseId === Number(EnterpriseId))
                : users.filter(user => [1, 2, 3, 4, null].includes(Number(user.EnterpriseId)));

            for (const user of usersByEnterprisesId) {
                let dailySalary = Number(user?.Salary?.dailySalary || 0);
                total += dailySalary * 26;
            }

            setMonthlyLimit(total);
        })()
    }, [attendances]);

    console.log("la putain de limit par mois", MonthlyLimit);

    useEffect(() => {
        (() => {
            let totalSalary = 0;
            const filter = attendances.filter(a => a.mounth === new Date().getMonth() && a.UserId === 1);
            for (const att of filter) totalSalary += parseInt(att?.Salary?.dailySalary);
            setTotalDeductionByMonth(totalSalary);
        })();
    }, [MonthlyLimit]);


    const YEARLY_LIMIT = MonthlyLimit * 12;

    const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
    const selectedMonth = monthlyBalances[selectedMonthIndex];
    const yearlySum = monthlyBalances.reduce((a, b) => a + b.value, 0);

    const COLORS = ["#1e90ff", "#ff4757", "#2ed573", "#ffa502", "#ff6b81", "#70a1ff", "#5352ed", "#ff7f50", "#3742fa", "#2ed573", "#ffa502", "#ff4757"];

    // Données pour les LineChart et BarChart
    const lineData = monthlyBalances.map(m => ({ month: m.month, value: m.value }));
    const barData = monthlyBalances.map((m, idx) => ({
        month: m.month,
        solde: m.value,
        limite: MonthlyLimit
    }));

    return { getDuductionByMonth, monthlyBalances, MonthlyLimit, YEARLY_LIMIT, setSelectedMonthIndex, selectedMonth, yearlySum, COLORS, lineData, barData, EnterpriseId, adminRole, attendances, selectedMonthIndex }
}