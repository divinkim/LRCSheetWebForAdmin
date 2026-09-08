"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Area,
  ComposedChart,
} from "recharts";

import { AnnualGainHook } from "./hook";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartColumn,
  faChartPie,
  faWallet,
  faCalendarDays,
  faLayerGroup,
  faArrowTrendDown,
  faArrowTrendUp,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

/* =========================================================
   FORMATTERS
========================================================= */

const formatMoney = (value: number) => {
  return `${value.toLocaleString("fr-FR")} FCFA`;
};

const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(
      value >= 10_000_000 ? 0 : 1
    )}M`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  return value.toString();
};

/* =========================================================
   TOOLTIP
========================================================= */

const CustomTooltip = ({
  active,
  payload,
  label,
}: any) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="min-w-[160px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">

      {label && (
        <p className="mb-2 text-[11px] font-black text-slate-700 dark:text-slate-200">
          {label}
        </p>
      )}

      <div className="space-y-1.5">
        {payload.map((item: any, index: number) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    item.color || item.fill || "#2563eb",
                }}
              />

              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                {item.name}
              </span>
            </div>

            <span className="text-[10px] font-black text-slate-900 dark:text-white">
              {typeof item.value === "number"
                ? formatMoney(item.value)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   DONUT COLORS
========================================================= */

const DONUT_COLORS = [
  "#2563eb",
  "#10b981",
];

/* =========================================================
   COMPONENT
========================================================= */

export default function GetAnnualGain() {
const {
  monthlyBalances,
  MonthlyLimit,
  YEARLY_LIMIT,
  setSelectedMonthIndex,
  selectedMonth,
  yearlySum,
  barData,
  selectedMonthIndex
} = AnnualGainHook();
  const currentYear = new Date().getFullYear();

  /* =======================================================
     DONUT DATA
     On utilise uniquement les données existantes :
     solde sélectionné + limite restante.
  ======================================================= */

  const selectedValue = selectedMonth?.value || 0;

  const remainingLimit = Math.max(
    0,
    MonthlyLimit - selectedValue
  );

  const donutData = [
    {
      name: "Solde",
      value: selectedValue,
    },
    {
      name: "Limite restante",
      value: remainingLimit,
    },
  ];

  /* =======================================================
     DONUT TOTAL
  ======================================================= */

  const donutTotal = selectedValue + remainingLimit;

  /* =======================================================
     EVOLUTION DES DEDUCTIONS

     On utilise barData uniquement si ton hook possède
     cette information dans sa structure.
  ======================================================= */

  const deductionEvolution = 0;

  /* =======================================================
     SOLDE VS LIMITE

     On transforme les données existantes en données pour
     le graphique linéaire.
  ======================================================= */

  const balanceLineData = monthlyBalances.map((item) => ({
    month: item.month,
    solde: item.value || 0,
    limite: MonthlyLimit,
  }));

  return (
    <div className="w-full space-y-5 sm:space-y-6">

      {/* ===================================================
          NAVIGATION DES MOIS
      =================================================== */}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {monthlyBalances.map((month, index) => {
          const active = selectedMonthIndex === index;

          return (
            <button
              key={month.month}
              type="button"
              onClick={() => setSelectedMonthIndex(index)}
              className={`
                shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2
                text-[11px] font-bold transition-all duration-200
                ${
                  active
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                }
              `}
            >
              {month.month}
            </button>
          );
        })}
      </div>

      {/* ===================================================
          PREMIERE LIGNE
      =================================================== */}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">

        {/* =================================================
            1. EVOLUTION DES GAINS MENSUELS
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-6">

          {/* HEADER */}

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FontAwesomeIcon
                  icon={faChartColumn}
                  className="text-sm"
                />
              </div>

              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Évolution des gains mensuels
                </h2>

                <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Visualisation des gains sur l'année {currentYear}
                </p>
              </div>

            </div>

            <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold text-slate-500 sm:block dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              Gains mensuels
            </div>

          </div>

          {/* GRAPH */}

          <div className="h-[290px] w-full p-3 sm:h-[315px] sm:p-5">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart
                data={barData}
                margin={{
                  top: 10,
                  right: 5,
                  left: -15,
                  bottom: 5,
                }}
              >

                <defs>

                  <linearGradient
                    id="gainGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#3b82f6"
                    />

                    <stop
                      offset="100%"
                      stopColor="#2563eb"
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                />

                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 10,
                    fill: "#64748b",
                  }}
                  tickFormatter={formatCompactMoney}
                />

                <Tooltip
                  content={<CustomTooltip />}
                />

                <Bar
                  dataKey="solde"
                  name="Gains"
                  fill="url(#gainGradient)"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={32}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>
        </div>

        {/* =================================================
            2. REPARTITION / DONUT
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">

          {/* HEADER */}

          <div className="border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <FontAwesomeIcon
                  icon={faChartPie}
                  className="text-sm"
                />
              </div>

              <div>

                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  Répartition du solde
                </h2>

                <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {selectedMonth?.month || "Mois sélectionné"}
                </p>

              </div>

            </div>

          </div>

          {/* DONUT */}

          <div className="flex min-h-[290px] flex-col items-center justify-center p-4">

            <div className="relative h-[190px] w-full max-w-[220px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <PieChart>

                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={3}
                    cornerRadius={5}
                    stroke="none"
                  >

                    {donutData.map((_, index) => (
                      <Cell
                        key={`donut-${index}`}
                        fill={
                          DONUT_COLORS[
                            index % DONUT_COLORS.length
                          ]
                        }
                      />
                    ))}

                  </Pie>

                  <Tooltip
                    content={<CustomTooltip />}
                  />

                </PieChart>

              </ResponsiveContainer>

              {/* CENTRE */}

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">

                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCompactMoney(donutTotal)}
                </span>

                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  FCFA
                </span>

              </div>

            </div>

            {/* LEGEND */}

            <div className="mt-2 w-full max-w-[230px] space-y-2.5">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />

                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Solde
                  </span>

                </div>

                <span className="text-[10px] font-black text-slate-800 dark:text-white">
                  {formatMoney(selectedValue)}
                </span>

              </div>

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                    Limite restante
                  </span>

                </div>

                <span className="text-[10px] font-black text-slate-800 dark:text-white">
                  {formatMoney(remainingLimit)}
                </span>

              </div>

            </div>

          </div>
        </div>

        {/* =================================================
            3. SYNTHESE FINANCIERE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">

          <div className="border-b border-slate-100 px-4 py-4 sm:px-5 dark:border-slate-800">

            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Synthèse financière
            </h2>

            <p className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
              Situation annuelle
            </p>

          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">

            {/* SOLDE CONSERVE */}

            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <FontAwesomeIcon
                  icon={faWallet}
                  className="text-xs"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-bold text-slate-500">
                  Solde conservé
                </p>

                <p className="truncate text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {formatMoney(selectedValue)}
                </p>

              </div>

            </div>

            {/* PLAFOND ANNUEL */}

            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="text-xs"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-bold text-slate-500">
                  Plafond annuel
                </p>

                <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                  {formatMoney(YEARLY_LIMIT)}
                </p>

              </div>

            </div>

            {/* CUMULE */}

            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <FontAwesomeIcon
                  icon={faLayerGroup}
                  className="text-xs"
                />
              </div>

              <div className="min-w-0">

                <p className="text-[10px] font-bold text-slate-500">
                  Cumul annuel
                </p>

                <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                  {formatMoney(yearlySum)}
                </p>

              </div>

            </div>

            {/* EVOLUTION DEDUCTIONS */}

            <div className="flex items-center gap-3 px-4 py-4 sm:px-5">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FontAwesomeIcon
                  icon={
                    deductionEvolution > 0
                      ? faArrowTrendUp
                      : faArrowTrendDown
                  }
                  className="text-xs"
                />
              </div>

              <div>

                <p className="text-[10px] font-bold text-slate-500">
                  Évolution des déductions
                </p>

                <p className="text-sm font-black text-rose-600 dark:text-rose-400">
                  {deductionEvolution}%
                </p>

              </div>

            </div>

          </div>

        </div>
      </div>

      {/* ===================================================
          DEUXIEME LIGNE
          SOLDE VS LIMITE
      =================================================== */}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">

        {/* HEADER */}

        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">

              <FontAwesomeIcon
                icon={faChartLine}
                className="text-sm"
              />

            </div>

            <div>

              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Solde vs Limite Mensuelle
              </h2>

              <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Comparaison du solde et du plafond mensuel
              </p>

            </div>

          </div>

          {/* LEGEND */}

          <div className="flex items-center gap-5 text-[10px] font-bold">

            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">

              <span className="h-[3px] w-6 rounded-full bg-blue-600" />

              Solde

            </div>

            <div className="flex items-center gap-2 text-slate-500">

              <span className="w-6 border-t-2 border-dashed border-slate-400" />

              Limite

            </div>

          </div>

        </div>

        {/* GRAPH */}

        <div className="h-[300px] w-full p-3 sm:h-[350px] sm:p-5">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >

            <ComposedChart
              data={balanceLineData}
              margin={{
                top: 10,
                right: 5,
                left: -15,
                bottom: 5,
              }}
            >

              <defs>

                <linearGradient
                  id="balanceArea"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >

                  <stop
                    offset="0%"
                    stopColor="#2563eb"
                    stopOpacity={0.20}
                  />

                  <stop
                    offset="100%"
                    stopColor="#2563eb"
                    stopOpacity={0.01}
                  />

                </linearGradient>

              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e2e8f0"
              />

              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fontSize: 10,
                  fill: "#64748b",
                }}
                tickFormatter={formatCompactMoney}
              />

              <Tooltip
                content={<CustomTooltip />}
              />

              {/* ZONE SOUS LA COURBE */}

              <Area
                type="monotone"
                dataKey="solde"
                name="Solde"
                fill="url(#balanceArea)"
                stroke="none"
              />

              {/* SOLDE */}

              <Line
                type="monotone"
                dataKey="solde"
                name="Solde"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#2563eb",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                }}
              />

              {/* LIMITE */}

              <Line
                type="monotone"
                dataKey="limite"
                name="Limite"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="6 6"
                dot={false}
              />

            </ComposedChart>

          </ResponsiveContainer>

        </div>

      </div>

    </div>
  );
}