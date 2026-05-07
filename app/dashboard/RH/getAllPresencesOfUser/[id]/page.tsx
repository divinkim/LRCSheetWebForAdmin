"use client";

import { useState, useRef, useEffect } from "react";
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
    photo: "",
    poste: "",
    Enterprise: { name: "", logo: "" }
  });

  const [presences, setPresences] = useState<number | null>(null);
  const [lates, setLates] = useState<number | null>(null);
  const [absences, setAbsences] = useState<number | null>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [totalSalary, setTotalSalary] = useState("");
  const [currentMonth, setCurrentMonth] = useState(0)
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
              Salary
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
                departureTime,
                dailySalary: Salary?.dailySalary || "0"
              }
            };
          });

        setEvents(formatted);

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
        photo: response.photo,
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

    const filterAttendance = attendances.filter(
      (attendance: {
        mounth: number, createdAt: string
      }) => attendance.mounth === monthIndex
    )

    for (const attendance of filterAttendance) {
      const status = attendance.status;
      const minutes = parseInt(attendance.arrivalTime.split(":")?.pop() ?? "");
      const endTime = attendance.Planning.endTime?.slice(0, 5) || "";
      const departureTime = attendance.departureTime?.slice(0, 5) || ""
      const finalMinutes = Number(minutes);
      const finalDailySalary = Number(dailySalary);
      let deductionAmount = 0;

      if (currentMonth < 4) {
        if (status === "En retard" && finalMinutes <= 15) {
          deductionAmount = Math.round(0.1 * finalDailySalary);
          totalLates += finalDailySalary - deductionAmount;
        } else if (status === "En retard" && finalMinutes > 15 && finalMinutes <= 30) {
          deductionAmount = Math.round(0.15 * finalDailySalary);
          totalLates += finalDailySalary - deductionAmount;
        } else if (status === "En retard" && finalMinutes > 30) {
          deductionAmount = Math.round(0.5 * finalDailySalary);
          totalAmount += finalDailySalary - deductionAmount;
        } else if (status === "A temps") {
          totalePresences += finalDailySalary;
        }
      } else {
        if (status === "En retard" && finalMinutes <= 15) {
          deductionAmount = Math.round(0.1 * finalDailySalary);
          totalLates += finalDailySalary - deductionAmount;
        } else if (status === "En retard" && finalMinutes > 15 && finalMinutes <= 30) {
          deductionAmount = Math.round(0.15 * finalDailySalary);
          totalLates += finalDailySalary - deductionAmount;
        } else if (status === "En retard" && finalMinutes > 30) {
          deductionAmount = Math.round(0.5 * finalDailySalary);
          totalAmount += finalDailySalary - deductionAmount;
        } else if ((status === "A temps" && departureTime < endTime) || (status === "A temps" && !departureTime)) {
          deductionAmount = Math.round(0.1 * finalDailySalary);
          totalePresences += finalDailySalary - deductionAmount;
        } else {
          totalePresences += finalDailySalary;
        }
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
            <div className="w-[200px] h-[200px]">
              <img src={data.photo ? `${providers.APIUrl}/images/${data.photo}` : "/images/clientProfile.png"} alt="" className="w-full h-full object-cover rounded-full" />
            </div>
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
            eventContent={(eventInfo) => renderEventContent(eventInfo, currentMonth)}
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
              setCurrentMonth(month);

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

function getData(
  arrivalTime: string,
  departureTime: string,
  endTime: string,
  status: string,
  dailySalary: number,
  currentMonth: number
) {
  let deductionAmount = 0;
  let deductionPercent = 0;

  const minutes = parseInt(arrivalTime.split(":")?.[1] || "0");
  if (currentMonth >= 4) {
    if (status === "En retard") {
      if (minutes <= 15) {
        deductionPercent = 10;
      } else if (minutes <= 30) {
        deductionPercent = 15;
      } else {
        deductionPercent = 50;
      }
    } else if ((status === "A temps" && !departureTime) || (status === "A temps" && departureTime < endTime)) {
      deductionPercent = 10;
    } else if (status === "Absent") {
      deductionPercent = 100;
    } else {
      deductionPercent = 0
    }
  } else {
    if (status === "En retard") {
      if (minutes <= 15) {
        deductionPercent = 10;
      } else if (minutes <= 30) {
        deductionPercent = 15;
      } else {
        deductionPercent = 50;
      }
    } else if (status === "A temps") {
      deductionPercent = 0;
    } else if (status === "Absent") {
      deductionPercent = 100;
    }
  }


  deductionAmount = Math.round((deductionPercent / 100) * dailySalary);

  return {
    deductionAmount,
    deductionPercent,
    dailySalary: dailySalary - deductionAmount,
  };
}


const renderEventContent = (eventInfo: any, currentMonth: number) => {
  const props = eventInfo.event.extendedProps;

  // Sécurisation des données
  const arrivalTime = props.arrivalTime || "";
  const departureTime = props.departureTime || "";
  const endTime = props.endTime || "";
  const status = props.status || "";
  const dailySalary = Number(props.dailySalary);
  console.log("props", currentMonth)
  // Calcul
  const result = getData(
    arrivalTime,
    departureTime,
    endTime,
    status,
    dailySalary,
    currentMonth
  );

  const colorMap: Record<string, string> = {
    Success: "text-green-600",
    Danger: "text-red-600",
    Warning: "text-yellow-500",
    Primary: "text-blue-500"
  };

  const statusColor = colorMap[props.calendar] || "text-gray-700";

  return (
    <div className="rounded-sm lg:text-[11.5px] 2xl:text-[14px] relative mb-5 ml-3">
      {/* Statut */}
      <div className="flex flex-row mb-2 space-x-2">
        <p className="text-gray-600 dark:text-gray-300 font-semibold">
          Statut:
        </p>
        <div className={`${statusColor} font-semibold`}>
          {status === "A temps"
            ? "✅ A temps"
            : status === "En retard"
              ? "⏳ En retard"
              : "❌ Absent"}
        </div>
      </div>

      {/* Arrivée */}
      <div className="text-gray-700 mb-2 dark:text-white">
        <span className="font-semibold">Arrivée:</span>{" "}
        {arrivalTime ? arrivalTime.slice(0, 5) : "-"}
      </div>

      {/* Départ */}
      <div className="text-gray-700 mb-2 dark:text-white">
        <span className="font-semibold">Départ:</span>{" "}
        {departureTime ? departureTime.slice(0, 5) : "-"}
      </div>
      {

        <div className={currentMonth >= 4 ? "block" : "hidden"}>
          {/* Déduction */}
          <div className="text-gray-700 mb-2 dark:text-white">
            <span className="font-semibold">
              Déduction: <span className='text-red-500 font-bold'>{result.deductionAmount.toLocaleString()} XAF</span>
            </span>
          </div>
          <div className="text-gray-700 mb-2 dark:text-white">
            <span className="font-semibold">
              Déduction en %: {" "}
              ({result.deductionPercent}%)
            </span>
          </div>
          {/* Salaire du jour */}
        </div>


      }
      <div className="text-gray-700 dark:text-white">
        <span className="font-semibold">
          Salaire du jour: <span className="bold text-blue-600">{result.dailySalary.toLocaleString()} XAF</span>
        </span>
      </div>
    </div>
  );
};
export default CalendarPage;
