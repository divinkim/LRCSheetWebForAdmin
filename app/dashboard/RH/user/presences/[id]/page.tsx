"use client";

import frLocale from "@fullcalendar/core/locales/fr";
import { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import { EventInput } from "@fullcalendar/core/index.js";
import { providers } from "@/index";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    name: string;
    status: string;
    arrivalTime: string;
    departureTime: string;
    dailySalary: string;
    startTime: string;
    endTime: string;
  };
}

const CalendarPage = () => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    dailySalary: "0",
    netSalary: "0",
    photo: "",
    poste: "",
    Enterprise: { name: "", logo: "", id: 0 },
  });

  const [presences, setPresences] = useState<number>(0);
  const [lates, setLates] = useState<number>(0);
  const [absences, setAbsences] = useState<number>(0);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [totalSalary, setTotalSalary] = useState<string>("0");
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());

  const calendarRef = useRef<FullCalendar>(null);

  /* ------------------------------------------------------
    Calculs des statistiques et du salaire
  ------------------------------------------------------ */
  const calculateMonthStats = useCallback(
    (attendanceData: any[], monthIndex: number, year: number, dailySalaryVal: number) => {
      const monthlyAttendances = attendanceData.filter((item: { createdAt: string }) => {
        const date = new Date(item.createdAt);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });

      // Calcul des présences / retards / absences
      const presCount = monthlyAttendances.filter((a) => a.status === "A temps").length;
      const latesCount = monthlyAttendances.filter((a) => a.status === "En retard").length;
      const absCount = monthlyAttendances.filter((a) => a.status === "Absent").length;

      setPresences(presCount);
      setLates(latesCount);
      setAbsences(absCount);

      // Calcul du salaire
      const calculatedSalary = monthlyAttendances.reduce((total, attendance) => {
        const deductionPercent = getDeductionPercent(
          attendance.status,
          attendance.arrivalTime || "",
          attendance.departureTime?.slice(0, 5) || "",
          attendance.Planning?.startTime || "",
          attendance.Planning?.endTime?.slice(0, 5) || "",
          monthIndex
        );

        const deductionAmount = Math.round((deductionPercent / 100) * dailySalaryVal);
        return total + (dailySalaryVal - deductionAmount);
      }, 0);

      setTotalSalary(calculatedSalary.toString());
    },
    []
  );

  /* ------------------------------------------------------
     📌 Chargement global des données (Profil + Événements)
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const id = window.location.pathname.split("/").pop();
        const userId = Number(id);

        const user = await providers.API.getOne(providers.APIUrl, "getUser", userId);
        const response = await providers.API.getAll(providers.APIUrl, "getAttendances", userId);

        const userDailySalary = user?.Salary?.dailySalary || "0";

        setData({
          firstname: user.firstname,
          lastname: user.lastname,
          dailySalary: userDailySalary,
          netSalary: user?.Salary?.netSalary || "0",
          photo: user.photo,
          poste: user?.Post?.title || "",
          Enterprise: {
            name: user?.Enterprise?.name || "",
            logo: user?.Enterprise?.logo || "",
            id: user?.EnterpriseId || 0,
          },
        });

        const attendanceList = response || [];
        setAttendances(attendanceList);

        const formatted: CalendarEvent[] = attendanceList
          .filter((item: any) => new Date(item.createdAt).getDay() !== 0)
          .map((item: any) => {
            const { id, arrivalTime, departureTime, createdAt, status, User, Salary, Planning } = item;

            const dateOnly = createdAt.split("T")[0];
            const start = `${dateOnly}T${arrivalTime || "00:00:00"}`;
            const end = `${dateOnly}T${departureTime || "00:00:00"}`;

            let calendarColor = "Primary";
            if (status === "A temps") calendarColor = "Success";
            else if (status === "En retard") calendarColor = "Warning";
            else if (status === "Absent") calendarColor = "Danger";

            return {
              id: id.toString(),
              start,
              end,
              allDay: false,
              extendedProps: {
                calendar: calendarColor,
                name: `${User?.lastname?.toUpperCase()} ${User?.firstname}`,
                status: status || "",
                arrivalTime: arrivalTime || "",
                departureTime: departureTime || "",
                dailySalary: Salary?.dailySalary || userDailySalary,
                startTime: Planning?.startTime || "00:00",
                endTime: Planning?.endTime || "00:00",
              },
            };
          });

        setEvents(formatted);

        // Mettre à jour immédiatement les stats pour le mois en cours
        const now = new Date();
        calculateMonthStats(attendanceList, now.getMonth(), now.getFullYear(), Number(userDailySalary));
      } catch (error) {
        console.error("Erreur événements :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [calculateMonthStats]);

  /* ------------------------------------------------------
    Rendu Skeleton (chargement)
  ------------------------------------------------------ */
  if (loading) {
    return (
      <div className="p-6 animate-pulse">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="bg-slate-700 px-8 py-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-6">
                <div className="h-40 w-40 rounded-full bg-slate-600"></div>
                <div className="space-y-3">
                  <div className="h-8 w-48 rounded-lg bg-slate-600"></div>
                  <div className="h-4 w-32 rounded-lg bg-slate-600"></div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="h-16 w-36 rounded-xl bg-slate-600"></div>
                    <div className="h-16 w-36 rounded-xl bg-slate-600"></div>
                  </div>
                </div>
              </div>
              <div className="h-24 w-56 rounded-2xl bg-slate-600"></div>
            </div>
          </div>
          <div className="grid gap-6 p-8 md:grid-cols-2 xl:grid-cols-4">
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
            <div className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
          </div>
          <div className="flex justify-end border-t border-slate-200 px-8 py-6 dark:border-slate-700">
            <div className="h-12 w-48 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          </div>
        </div>
        <div className="mt-8 h-[600px] rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-between pb-6">
            <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-10 w-48 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
            <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800"></div>
          </div>
          <div className="h-full w-full rounded-2xl bg-slate-100 dark:bg-slate-800"></div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------
     📌 Rendu composant chargé
  ------------------------------------------------------ */
  return (
    <div className="p-6">
      {/* Carte principale */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-800 px-8 py-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            {/* Profil */}
            <div className="flex items-center gap-6">
              <img
                src={
                  data.photo
                    ? `${providers.APIUrl}/images/${data.photo}`
                    : "/images/clientProfile.png"
                }
                alt="Profil"
                className="h-40 w-40 rounded-full border-4 border-white object-cover shadow-2xl"
              />

              <div>
                <h1 className="text-3xl font-bold text-white">
                  {data.lastname} {data.firstname}
                </h1>

                <p className="mt-2 text-blue-100">{data.poste}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-sm text-blue-100">Salaire journalier</p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      {Number(data.dailySalary).toLocaleString("fr-FR")} FCFA
                    </h3>
                  </div>

                  <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur">
                    <p className="text-sm text-blue-100">Salaire net</p>
                    <h3 className="mt-1 text-lg font-bold text-white">
                      {Number(data.netSalary).toLocaleString("fr-FR")} FCFA
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Entreprise */}
            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <p className="mb-4 text-sm uppercase tracking-wider text-blue-100">
                Entreprise
              </p>
              <div className="flex items-center gap-4">
                <img
                  src={`${providers.APIUrl}/images/${data.Enterprise.logo}`}
                  alt="Logo Entreprise"
                  className="h-14 w-14 rounded-full border-2 border-white object-cover"
                />
                <div>
                  <h3 className="font-bold text-white">{data.Enterprise.name}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid gap-6 p-8 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
            <p className="text-sm font-medium text-green-600">Présences</p>
            <h2 className="mt-3 text-4xl font-bold text-green-700">{presences}</h2>
          </div>

          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm font-medium text-orange-600">Retards</p>
            <h2 className="mt-3 text-4xl font-bold text-orange-700">{lates}</h2>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm font-medium text-red-600">Absences</p>
            <h2 className="mt-3 text-4xl font-bold text-red-700">{absences}</h2>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
            <p className="text-sm font-medium text-blue-600">Salaire calculé</p>
            <h2 className="mt-3 text-2xl font-bold text-blue-700">
              {Number(totalSalary).toLocaleString("fr-FR")} FCFA
            </h2>
          </div>
        </div>

        {/* Action */}
        <div className="flex justify-end border-t border-slate-200 px-8 py-6 dark:border-slate-700">
          <button
            className="rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:bg-green-700"
          >
            💳 Payer via DTMoney
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          locale={frLocale}
          eventContent={(eventInfo) =>
            renderEventContent(eventInfo, currentMonth)
          }
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          hiddenDays={data.Enterprise.id === 2 ? [] : [0]}
          datesSet={() => {
            const calendarApi = calendarRef.current?.getApi();
            if (!calendarApi) return;

            const month = calendarApi.getDate().getMonth();
            const year = calendarApi.getDate().getFullYear();

            setCurrentMonth(month);
            setCurrentYear(year);

            calculateMonthStats(attendances, month, year, Number(data.dailySalary));
          }}
        />
      </div>
    </div>
  );
};

/* ------------------------------------------------------
   📌 Fonctions Utilitaires
------------------------------------------------------ */

function getDeductionPercent(
  status: string,
  arrivalTime: string,
  departureTime: string,
  startTime: string,
  endTime: string,
  monthIndex: number
): number {
  if (status === "Absent") return 100;

  const parts = arrivalTime.split(":");
  const minutes = Number(parts[1] || 0);
  const startHour = startTime.slice(0, 2);

  if (status === "En retard") {
    if (minutes <= 15 && arrivalTime < `${startHour}:30`) return 10;
    if (minutes > 15 && arrivalTime < `${startHour}:30`) return 15;
    if (arrivalTime >= `${startHour}:30`) return 50;
  }

  if (
    monthIndex >= 4 &&
    status === "A temps" &&
    (!departureTime || departureTime < endTime)
  ) {
    return 10;
  }

  return 0;
}

function getData(
  arrivalTime: string,
  departureTime: string,
  startTime: string,
  endTime: string,
  status: string,
  dailySalary: number,
  monthIndex: number
) {
  let deductionPercent = getDeductionPercent(
    status,
    arrivalTime,
    departureTime,
    startTime,
    endTime,
    monthIndex
  );

  const deductionAmount = Math.round((deductionPercent / 100) * dailySalary);

  return {
    deductionAmount,
    deductionPercent,
    dailySalary: dailySalary - deductionAmount,
  };
}

const renderEventContent = (eventInfo: any, currentMonth: number) => {
  const props = eventInfo.event.extendedProps;

  const arrivalTime = props.arrivalTime || "";
  const departureTime = props.departureTime || "";
  const endTime = props.endTime || "";
  const status = props.status || "";
  const startTime = props.startTime || "";
  const dailySalary = Number(props.dailySalary) || 0;

  const result = getData(
    arrivalTime,
    departureTime,
    startTime,
    endTime,
    status,
    dailySalary,
    currentMonth
  );

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            status === "A temps"
              ? "bg-green-100 text-green-700"
              : status === "En retard"
              ? "bg-orange-100 text-orange-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Arrivée</span>
          <span className="text-slate-700 dark:text-white">
            {["00:00", "00:00:00", ""].includes(arrivalTime?.slice(0, 5)) ? "--" : arrivalTime?.slice(0, 5)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Départ</span>
          <span className="text-slate-700 dark:text-white">
            {departureTime?.slice(0, 5) || "--"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Début</span>
          <span className="text-slate-700 dark:text-white">
            {startTime?.slice(0, 5) || "--"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-semibold text-slate-500">Fin</span>
          <span className="text-slate-700 dark:text-white">
            {endTime?.slice(0, 5) || "--"}
          </span>
        </div>
      </div>

      {currentMonth >= 4 && (
        <div className="mt-3 rounded-lg bg-orange-50 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-xs font-semibold text-orange-700">Déduction</span>
            <span className="font-bold text-red-600">
              {result.deductionAmount.toLocaleString("fr-FR")} XAF
            </span>
          </div>

          <div className="mt-2 flex justify-between text-sm">
            <span className="font-semibold text-orange-700">%</span>
            <span className="font-bold text-orange-600">
              {result.deductionPercent}%
            </span>
          </div>
        </div>
      )}

      <div className="mt-3 rounded-lg bg-blue-50 p-3">
        <div className="flex justify-between">
          <span className="font-semibold text-blue-700">Solde</span>
          <span className="font-bold text-blue-700">
            {result.dailySalary.toLocaleString("fr-FR")} XAF
          </span>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;