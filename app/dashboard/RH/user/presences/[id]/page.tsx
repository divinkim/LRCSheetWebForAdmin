"use client";

import frLocale from "@fullcalendar/core/locales/fr";
import { useState, useRef, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid/index.js";
import timeGridPlugin from "@fullcalendar/timegrid/index.js";
import interactionPlugin from "@fullcalendar/interaction/index.js";
import { EventInput } from "@fullcalendar/core/index.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserCheck,
  faClock,
  faUserXmark,
  faWallet,
  faCreditCard,
  faBuilding,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { AttendanceListDto, AttendancesResponseDto, UserResponseDto } from "@/types/global";

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

/* =========================================================
   THEME — même identité que le reste du tableau de bord
========================================================= */

const GOLD = "#c9a24b";
const SERIF = "'Fraunces', 'Playfair Display', Georgia, serif";

const CARD =
  "rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)] dark:border-white/5 dark:bg-[#0f1a33] dark:shadow-none";

/* Habillage de FullCalendar */
const CALENDAR_CSS = `
.fc-premium { --fc-border-color: #e7eaf0; --fc-today-bg-color: rgba(201,162,75,0.08); --fc-page-bg-color: transparent; --fc-neutral-bg-color: #f5f6fa; font-size: 0.875rem; }
.dark .fc-premium { --fc-border-color: rgba(255,255,255,0.07); --fc-today-bg-color: rgba(201,162,75,0.10); --fc-neutral-bg-color: rgba(255,255,255,0.03); color: #cbd5e1; }
.fc-premium .fc-toolbar { gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.25rem !important; }
.fc-premium .fc-toolbar-title { font-family: ${SERIF}; font-size: 1.5rem !important; font-weight: 500; text-transform: capitalize; color: #0f172a; }
.dark .fc-premium .fc-toolbar-title { color: #fff; }
.fc-premium .fc-button { background: transparent !important; border: 1px solid #e2e8f0 !important; color: #475569 !important; border-radius: 9999px !important; padding: 0.45rem 1rem !important; font-weight: 500; text-transform: capitalize; box-shadow: none !important; transition: border-color .2s, color .2s; }
.dark .fc-premium .fc-button { border-color: rgba(255,255,255,0.12) !important; color: #cbd5e1 !important; }
.fc-premium .fc-button:hover { border-color: ${GOLD} !important; color: #0f172a !important; }
.dark .fc-premium .fc-button:hover { color: #fff !important; }
.fc-premium .fc-button:focus-visible { outline: 2px solid ${GOLD}; outline-offset: 2px; }
.fc-premium .fc-button-primary:not(:disabled).fc-button-active, .fc-premium .fc-button-primary:not(:disabled):active { background: #0b1530 !important; border-color: #0b1530 !important; color: #fff !important; }
.dark .fc-premium .fc-button-primary:not(:disabled).fc-button-active { background: ${GOLD} !important; border-color: ${GOLD} !important; color: #0b1530 !important; }
.fc-premium .fc-button:disabled { opacity: .4; }
.fc-premium .fc-col-header-cell { padding: 0.75rem 0; background: transparent; }
.fc-premium .fc-col-header-cell-cushion { font-weight: 500; font-size: 0.75rem; color: #64748b; text-transform: capitalize; }
.fc-premium .fc-daygrid-day-number { font-size: 0.75rem; font-weight: 500; color: #64748b; padding: 0.5rem 0.65rem; }
.fc-premium .fc-day-today .fc-daygrid-day-number { color: #9a7a2c; font-weight: 700; }
.fc-premium .fc-theme-standard td, .fc-premium .fc-theme-standard th, .fc-premium .fc-theme-standard .fc-scrollgrid { border-color: var(--fc-border-color); }
.fc-premium .fc-scrollgrid { border-radius: 1rem; overflow: hidden; }
.fc-premium .fc-event { background: transparent !important; border: none !important; box-shadow: none !important; }
.fc-premium .fc-daygrid-event-harness { margin: 2px 4px; }
`;

const STATUS_PILL: Record<string, string> = {
  "A temps": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "En retard": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};
const STATUS_DOT: Record<string, string> = {
  "A temps": "bg-emerald-500",
  "En retard": "bg-amber-500",
};
const PILL_FALLBACK = "bg-rose-500/10 text-rose-700 dark:text-rose-400";
const DOT_FALLBACK = "bg-rose-500";

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
  const [attendances, setAttendances] = useState<AttendanceListDto[]>([]);
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
        if (!item.createdAt) return false;
        const date = new Date(item.createdAt);
        return date.getMonth() === monthIndex && date.getFullYear() === year;
      });

      const presCount = monthlyAttendances.filter((a) => a.status === "A temps").length;
      const latesCount = monthlyAttendances.filter((a) => a.status === "En retard").length;
      const absCount = monthlyAttendances.filter((a) => a.status === "Absent").length;

      setPresences(presCount);
      setLates(latesCount);
      setAbsences(absCount);

      let totalSalaryCalculated = 0;

      for (const attendance of monthlyAttendances) {
        const status = attendance.status || "";
        const arrivalTime = attendance.arrivalTime || "";
        const departureTime = attendance.departureTime || "";
        const startTime = attendance?.Planning?.startTime?.split("T")[1]?.slice(0, 5) || "00:00";
        const endTime = attendance?.Planning?.endTime?.split("T")[1]?.slice(0, 5) || "00:00";

        const result = getData(
          arrivalTime,
          departureTime,
          startTime,
          endTime,
          status,
          dailySalaryVal,
          monthIndex
        );

        totalSalaryCalculated += result.dailySalary;
      }

      setTotalSalary(String(totalSalaryCalculated));
    },
    []
  );

  /* ------------------------------------------------------
     Chargement global des données (Profil + Événements)
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const id = window.location.pathname.split("/").pop();
        const userId = Number(id);

        const user = await providers.API.getOne<UserResponseDto>(providers.APIUrl, "users", userId);
        const response = await providers.API.getAll<AttendancesResponseDto>(providers.APIUrl, "attendances/me", userId);

        const userDailySalary = user.data.Salary?.dailySalary || "0";

        setData({
          firstname: user.data.firstname,
          lastname: user.data.lastname,
          dailySalary: userDailySalary,
          netSalary: user.data.Salary?.netSalary || "0",
          photo: user.data.photo,
          poste: user.data.Post?.title || "",
          Enterprise: {
            name: user.data.Enterprise?.name || "",
            logo: user.data.Enterprise?.logo || "",
            id: user.data.EnterpriseId || 0,
          },
        });

        const attendanceList = response || [];
        setAttendances(attendanceList.data);

        const formatted: CalendarEvent[] = attendanceList.data
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
            const startTime = Planning?.startTime?.split("T")[1]?.slice(0, 5);
            const endTime = Planning?.endTime?.split("T")[1]?.slice(0, 5);
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
                startTime,
                endTime,
              },
            };
          });

        setEvents(formatted);

        const now = new Date();
        calculateMonthStats(attendanceList.data, now.getMonth(), now.getFullYear(), Number(userDailySalary));
      } catch (error) {
        console.error("Erreur événements :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [calculateMonthStats]);

  /* ------------------------------------------------------
    Skeleton (chargement)
  ------------------------------------------------------ */
  if (loading) {
    const bar = "bg-slate-200 dark:bg-white/10";
    return (
      <div className="min-h-screen animate-pulse space-y-7 bg-[#f5f6fa] p-4 dark:bg-[#070e20] sm:p-6 lg:p-8">
        <div className="overflow-hidden rounded-3xl bg-[#0b1530] px-8 py-10">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 rounded-full bg-white/10" />
              <div className="space-y-3">
                <div className="h-8 w-56 rounded-lg bg-white/10" />
                <div className="h-4 w-32 rounded-lg bg-white/10" />
                <div className="mt-5 flex gap-3">
                  <div className="h-16 w-40 rounded-2xl bg-white/10" />
                  <div className="h-16 w-40 rounded-2xl bg-white/10" />
                </div>
              </div>
            </div>
            <div className="h-20 w-56 rounded-2xl bg-white/10" />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${CARD} h-32 p-6`}>
              <div className={`h-3 w-20 rounded ${bar}`} />
              <div className={`mt-4 h-9 w-16 rounded ${bar}`} />
            </div>
          ))}
        </div>
        <div className={`${CARD} h-[560px] p-6`}>
          <div className={`h-10 w-48 rounded-full ${bar}`} />
          <div className="mt-6 h-[440px] w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Présences",
      value: presences,
      icon: faUserCheck,
      tone: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/25 dark:text-emerald-400",
      valueTone: "text-emerald-700 dark:text-emerald-400",
    },
    {
      label: "Retards",
      value: lates,
      icon: faClock,
      tone: "text-amber-600 bg-amber-500/10 ring-amber-500/25 dark:text-amber-400",
      valueTone: "text-amber-700 dark:text-amber-400",
    },
    {
      label: "Absences",
      value: absences,
      icon: faUserXmark,
      tone: "text-rose-600 bg-rose-500/10 ring-rose-500/25 dark:text-rose-400",
      valueTone: "text-rose-700 dark:text-rose-400",
    },
  ];

  /* ------------------------------------------------------
     Rendu
  ------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-[#f5f6fa] p-4 transition-colors dark:bg-[#070e20] sm:p-6 lg:p-8">
      <style>{CALENDAR_CSS}</style>

      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* ===============================================
            HERO — PROFIL
        =============================================== */}
        <section
          className="relative overflow-hidden rounded-3xl text-white shadow-[0_24px_60px_-20px_rgba(11,21,48,0.55)]"
          style={{
            background:
              "radial-gradient(120% 160% at 0% 0%, #1b2f66 0%, #0b1530 55%, #070e20 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ background: GOLD }}
          />

          <div className="relative flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10 xl:flex-row xl:items-center xl:justify-between">
            {/* Profil */}
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <img
                src={
                  data.photo
                    ? `${providers.ImageUrl}/${data.photo}`
                    : "/images/clientProfile.png"
                }
                alt="Profil"
                className="h-32 w-32 shrink-0 rounded-full object-cover shadow-2xl ring-4 ring-[#c9a24b]/60 ring-offset-4 ring-offset-[#0b1530] sm:h-36 sm:w-36"
              />

              <div className="min-w-0">
                <h1
                  className="text-3xl font-medium leading-tight tracking-tight sm:text-4xl"
                  style={{ fontFamily: SERIF }}
                >
                  {data.lastname} {data.firstname}
                </h1>

                <p className="mt-1.5 text-sm text-[#e3c47a]">{data.poste}</p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur">
                    <p className="text-xs text-white/55">Salaire journalier</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(data.dailySalary).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur">
                    <p className="text-xs text-white/55">Salaire net</p>
                    <p className="mt-1 text-lg font-semibold">
                      {Number(data.netSalary).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Entreprise */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur xl:min-w-[260px]">
              {data.Enterprise.logo ? (
                <img
                  src={`${providers.ImageUrl}/${data.Enterprise.logo}`}
                  alt="Logo Entreprise"
                  className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-[#c9a24b]/60"
                />
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-[#0b1530]" style={{ background: GOLD }}>
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs text-white/55">Entreprise</p>
                <h3 className="mt-0.5 truncate font-semibold">{data.Enterprise.name}</h3>
              </div>
            </div>
          </div>
        </section>

        {/* ===============================================
            STATISTIQUES
        =============================================== */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={`${CARD} flex items-center justify-between p-6`}>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{kpi.label}</p>
                <p
                  className={`mt-1.5 text-4xl font-medium tracking-tight ${kpi.valueTone}`}
                  style={{ fontFamily: SERIF }}
                >
                  {kpi.value}
                </p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ${kpi.tone}`}>
                <FontAwesomeIcon icon={kpi.icon} />
              </div>
            </div>
          ))}

          {/* Salaire calculé — mis en avant */}
          <div
            className="relative flex items-center justify-between overflow-hidden rounded-3xl p-6 text-white shadow-[0_20px_40px_-16px_rgba(11,21,48,0.5)]"
            style={{ background: "linear-gradient(135deg, #14244f 0%, #0b1530 100%)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-30 blur-2xl"
              style={{ background: GOLD }}
            />
            <div className="relative min-w-0">
              <p className="text-sm text-white/60">Salaire calculé</p>
              <p
                className="mt-1.5 truncate text-3xl font-medium tracking-tight"
                style={{ fontFamily: SERIF }}
              >
                {Math.round(Number(totalSalary)).toLocaleString("fr-FR")}
                <span className="ml-1.5 text-sm font-normal text-[#c9a24b]">FCFA</span>
              </p>
            </div>
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#c9a24b] ring-1 ring-[#c9a24b]/40">
              <FontAwesomeIcon icon={faWallet} />
            </div>
          </div>
        </div>

        {/* ===============================================
            ACTION
        =============================================== */}
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center gap-2.5 rounded-full bg-[#0b1530] px-7 py-3 text-sm font-semibold text-white shadow-md shadow-[#0b1530]/20 transition-colors hover:bg-[#14244f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] focus-visible:ring-offset-2 dark:bg-[#c9a24b] dark:text-[#0b1530] dark:shadow-none dark:hover:bg-[#d8b45f] dark:focus-visible:ring-offset-[#070e20]"
          >
            <FontAwesomeIcon icon={faCreditCard} />
            Payer via DTMoney
          </button>
        </div>

        {/* ===============================================
            CALENDRIER
        =============================================== */}
        <div className={`${CARD} fc-premium p-4 sm:p-6`}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={frLocale}
            eventContent={(eventInfo) => renderEventContent(eventInfo, currentMonth)}
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
    </div>
  );
};

/* ------------------------------------------------------
   Fonctions utilitaires (logique inchangée)
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
    if (arrivalTime > `${startHour}:30`) return 50;
  }

  if (
    monthIndex >= 4 &&
    status === "A temps" &&
    (!departureTime || departureTime < endTime?.slice(0, 5))
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

/* ------------------------------------------------------
   Carte d'événement du calendrier
------------------------------------------------------ */

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

  const arrival = ["00:00", "00:00:00", ""].includes(arrivalTime?.slice(0, 5))
    ? "--"
    : arrivalTime?.slice(0, 5);

  const rows: [string, string][] = [
    ["Arrivée", arrival],
    ["Départ", departureTime?.slice(0, 5) || "--"],
    ["Début", startTime?.slice(0, 5) || "--"],
    ["Fin", endTime?.slice(0, 5) || "--"],
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_4px_16px_-8px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-[#14244f]">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
          STATUS_PILL[status] ?? PILL_FALLBACK
        }`}
      >
        <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${STATUS_DOT[status] ?? DOT_FALLBACK}`} />
        {status}
      </span>

      <dl className="mt-3 space-y-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-slate-400">{label}</dt>
            <dd className="font-medium text-slate-800 dark:text-white">{value}</dd>
          </div>
        ))}
      </dl>

      {currentMonth >= 4 && (
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs dark:border-white/10">
          {/* <span className="text-slate-400">Déduction</span> */}
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {result.deductionAmount.toLocaleString("fr-FR")} XAF
            <span className="ml-1 font-normal text-slate-400">({result.deductionPercent}%)</span>
          </span>
        </div>
      )}

      <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#0b1530] px-3 py-2 text-xs text-white">
        <span className="text-white/60">Solde</span>
        <span className="font-semibold text-[#e3c47a]">
          {result.dailySalary.toLocaleString("fr-FR")} XAF
        </span>
      </div>
    </div>
  );
};

export default CalendarPage;
