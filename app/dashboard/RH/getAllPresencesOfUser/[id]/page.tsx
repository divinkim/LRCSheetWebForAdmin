"use client";

import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput } from "@fullcalendar/core";
import { providers } from "@/index";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    name: string;
    status: string;
    arrivalTime: string;
    endTime: string;
  };
}

const CalendarPage = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [data, setData] = useState({
    firstname: "",
    lastname: "",
    dailySalary: "",
    netSalary: "",
    poste: "",
    Enterprise: { name: "", logo: "" }
  });

  const [presences, setPresences] = useState<number | null>(null);
  const [lates, setLates] = useState<number | null>(null);
  const [absences, setAbsences] = useState<number | null>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [totalSalary, setTotalSalary] = useState("");

  const calendarRef = useRef<FullCalendar>(null);

  /* ------------------------------------------------------
     📌 1. Récupération des événements (attendances)
  ------------------------------------------------------ */
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const id = window.location.pathname.split("/").pop();
        const response = await providers.API.getAll(providers.APIUrl, "getAttendances", Number(id));

        setAttendances(response);

        const formatted: CalendarEvent[] = response
          .filter((item: any) => new Date(item.createdAt).getDay() !== 0)
          .map((item: any) => {
            const {
              id,
              arrivalTime,
              departureTime,
              createdAt,
              status,
              User,
            } = item;

            const dateOnly = createdAt.split("T")[0];
            const start = `${dateOnly}T${arrivalTime}`;
            const end = `${dateOnly}T${departureTime}`;

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
                status,
                arrivalTime,
                departureTime
              }
            };
          });

        setEvents(formatted);

      } catch (error) {
        console.error("Erreur événements :", error);
      }
    };

    fetchEvents();
  }, []);

  /* ------------------------------------------------------
     📌 2. Récupération du profil utilisateur
  ------------------------------------------------------ */
  useEffect(() => {
    (async () => {
      const id = window.location.pathname.split("/").pop();
      const response = await providers.API.getOne(providers.APIUrl, "getUser", Number(id));

      setData({
        firstname: response.firstname,
        lastname: response.lastname,
        dailySalary: response.Salary?.dailySalary,
        netSalary: response.Salary?.netSalary,
        poste: response.Post?.title,
        Enterprise: {
          name: response?.Enterprise?.name,
          logo: response?.Enterprise?.logo
        }
      });
    })();
  }, []);

  /* ------------------------------------------------------
    Calcul salaire
  ------------------------------------------------------ */
  function getTotalSalary(attendances: any[], monthIndex: number, dailySalary: any) {
    let totalAmount: number = 0;
    let totalLates: number = 0;
    let totalePresences: number = 0;

    const filterAttendance = attendances.filter((attendance: { mounth: number, createdAt: string }) => attendance.mounth === monthIndex)

    for (const attendance of filterAttendance) {
      const status = attendance.status;
      const minutes = parseInt(attendance.arrivalTime.split(":")?.pop() ?? "");
      const finalMinutes = Number(minutes);
      const finalDailySalary = Number(dailySalary);
      let deductionAmount = 0;
      const toleranceTime = parseInt(attendance.Enterprise?.toleranceTime ?? "");
      const maxToleranceTime = parseInt(attendance.Enterprise?.maxToleranceTime ?? "") ?? 0;
      const pourcentageOfHourlyDeduction = parseFloat(attendance.Enterprise?.pourcentageOfHourlyDeduction ?? "") ?? 0;
      const maxPourcentageOfHourlyDeduction = parseFloat(attendance.Enterprise?.maxPourcentageOfHourlyDeduction ?? "") ?? 0;

      // const pourcent = pourcentageOfHourlyDeduction / 100;
      // const maxPourcent = maxPourcentageOfHourlyDeduction / 100;

      // if (status === "En retard" && arrivalTime > toleranceTime && arrivalTime < maxToleranceTime) {
      //   totalLates += parseInt(dailySalary) * pourcent;
      // } else if (status === "En retard" && arrivalTime > maxToleranceTime) {
      //   totalLates += parseInt(dailySalary) * maxPourcent;
      // }
      // if (attendance.status === "A temps") {
      //   totalePresences += parseInt(dailySalary);
      // }

      if (status === "En retard" && finalMinutes <= 15) {
        deductionAmount = Math.round(0.1 * finalDailySalary);
        totalLates += finalDailySalary - deductionAmount;
      } else if (status === "En retard" && finalMinutes > 15 && finalMinutes <= 30) {
        deductionAmount = Math.round(0.15 * finalDailySalary);
        totalLates += finalDailySalary - deductionAmount;
      } else if (status === "En retard" && finalMinutes > 30) {
        deductionAmount = Math.round(0.5 * finalDailySalary);
        totalLates += finalDailySalary - deductionAmount;
      } else if (status === "A temps") {
        totalePresences += finalDailySalary;
      }
    }

    totalAmount = totalLates + totalePresences;
    setTotalSalary(totalAmount.toString());
  }

  // console.log("Le salaire", totalSalary)

  function getAttendancesStats(attendances: any[], monthIndex: number) {
    return {
      presencesCount: attendances.filter(a => a.mounth === monthIndex && a.status === "A temps").length,
      latesCount: attendances.filter(a => a.mounth === monthIndex && a.status === "En retard").length,
      absencesCount: attendances.filter(a => a.mounth === monthIndex && a.status === "Absent").length,
    };
  }

  /* ------------------------------------------------------
     📌 Rendu
  ------------------------------------------------------ */
  return (
    <div>
      <div className="flex">
        <div className="rounded-2xl border w-full m-4 border-gray-200 dark:border-gray-300 dark:bg-gray-900 bg-white py-6 px-4">
          {/* Header Infos Employé */}
          <div className="flex mb-6  p-10 bg-gray-800 rounded shadow-sm justify-between">
            <div className="flex flex-col space-y-2 font-semibold text-gray-300">
              <p><span className="font-bold">Nom:</span> {data.firstname}</p>
              <p><span className="font-bold">Prénom:</span> {data.lastname}</p>
              <p><span className="font-bold">Poste:</span> {data.poste}</p>
              <p><span className="font-bold">Salaire journalier:</span> {data.dailySalary?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " XAF"}</p>
              <p><span className="font-bold">Salaire net:</span> {data.netSalary?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " XAF"}</p>

              <div className="flex items-center space-x-3">
                <span className="font-bold">Entreprise:</span>
                <img
                  src={`${providers.APIUrl}/images/${data.Enterprise.logo}`}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <p>{data.Enterprise.name}</p>
              </div>
            </div>

            {/* Statistiques */}
            <div>
              <h1 className="text-lg font-bold mb-2.5 text-gray-200">Statistiques du mois</h1>
              <div className="flex flex-col space-y-2 font-semibold">
                <p className="text-red-400">❌ Absences: {absences ?? "0"}</p>
                <p className="text-green-400">✅ Présences: {presences ?? "0"}</p>
                <p className="text-yellow-400">⏳ Retards: {lates ?? "0"}</p>
                <p className="text-white">💵 Total : {totalSalary.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA"}</p>
              </div>
            </div>

            <button className="bg-green-600 mt-3 ease duration-500 hover:bg-green-700 h-[55px] font-semibold px-12 text-white rounded-full">
              Payer via DTMoney
            </button>
          </div>

          {/* Calendrier */}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            eventContent={renderEventContent}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            hiddenDays={[0]}
            datesSet={() => {
              const calendarApi = calendarRef.current?.getApi();
              if (!calendarApi) return;

              const month = calendarApi.getDate().getMonth();

              getTotalSalary(attendances, month, data.dailySalary);

              const stats = getAttendancesStats(attendances, month);
              setPresences(stats.presencesCount);
              setLates(stats.latesCount);
              setAbsences(stats.absencesCount);
            }}
          />
        </div>
      </div>

    </div>

  );
};
const renderEventContent = (eventInfo: any) => {
  const props = eventInfo.event.extendedProps;
  const colorMap: Record<string, string> = {
    Success: "text-green-600",
    Danger: "text-red-600",
    Warning: "text-yellow-500",
    Primary: "text-blue-500"
  };

  const statusColor = colorMap[props.calendar] || "text-gray-700";

  return (
    <div className={`rounded-sm relative mb-5 ml-3`}>
      <div className="flex flex-row mb-2 space-x-2 ">
        <p className="text-gray-600 dark:text-gray-300 font-semibold">
          Statut:
        </p>
        <div className={`${statusColor}, font-semibold`}> {props.status === "A temps" ? "✅" + props.status : props.status === "En retard" ? "⏳ En retard" : "❌ Absent"}
        </div>
      </div>
      <div className="text-gray-700 mb-2 dark:text-white">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">Arrivée:</span>   {props.arrivalTime === null ? "-" : props.arrivalTime?.slice(0, 5)}
      </div>
      <div className="text-gray-700 mb-2 dark:text-white">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">Pause:</span>   {props.breakStartTime === null ? "-" : props.breakStartTime?.slice(0, 5)}
      </div>
      <div className="text-gray-700 mb-2 dark:text-white">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">Reprise:</span>   {props.resumeTime === null ? "-" : props.resumeTime?.slice(0, 5)}
      </div>
      <div className="text-gray-700 dark:text-white">
        <span className="text-gray-600 dark:text-gray-300 font-semibold">Départ:</span> {props.departureTime === null ? "-" : props.departureTime?.slice(0, 5)}
      </div>
    </div>
  );
};
export default CalendarPage;
