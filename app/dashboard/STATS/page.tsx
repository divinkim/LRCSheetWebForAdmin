"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
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
  faChartLine,
  faArrowTrendDown,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";

/* =========================================================
   THEME — une seule source pour les couleurs des graphiques
   Pour changer l'identité (violet, vert…), modifie ici.
========================================================= */

const THEME = {
  primary: "#1e3a8a",
  primarySoft: "#3b5fc4",
  accent: "#c9a24b", // or
  grid: "#e7eaf0",
  axis: "#8a94a6",
};

const SERIF = "'Fraunces', 'Playfair Display', Georgia, serif";

/* =========================================================
   FORMATTERS
========================================================= */

const formatMoney = (value: number) =>
  `${value.toLocaleString("fr-FR")} FCFA`;

const formatCompactMoney = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}K`;
  }
  return value.toString();
};

/* =========================================================
   TOOLTIP
========================================================= */

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="min-w-[180px] rounded-xl border border-white/10 bg-[#0b1530]/95 p-3.5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      {label && (
        <p className="mb-2 text-[11px] font-semibold text-white/90">
          {label}
        </p>
      )}

      <div className="space-y-1.5">
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: item.color || item.fill || THEME.accent,
                }}
              />
              <span className="text-[10px] font-medium text-white/60">
                {item.name}
              </span>
            </div>

            <span className="text-[10px] font-bold text-white">
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
   CARTE + EN-TÊTE RÉUTILISABLES
========================================================= */

const CARD =
  "overflow-hidden rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)] dark:border-white/5 dark:bg-[#0f1a33] dark:shadow-none";

const CardHeader = ({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: any;
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-3 px-6 pt-6">
    <div className="flex items-center gap-3.5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-[#c9a24b] ring-1 ring-[#c9a24b]/30"
        style={{ background: "rgba(201,162,75,0.08)" }}
      >
        <FontAwesomeIcon icon={icon} className="text-sm" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
    {right}
  </div>
);

/* =========================================================
   DONUT COLORS
========================================================= */

const DONUT_COLORS = [THEME.primary, THEME.accent];

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
    selectedMonthIndex,
  } = AnnualGainHook();

  const currentYear = new Date().getFullYear();

  /* ---------- Données ---------- */

  const selectedValue = selectedMonth?.value || 0;
  const remainingLimit = Math.max(0, MonthlyLimit - selectedValue);

  const donutData = [
    { name: "Solde", value: selectedValue },
    { name: "Limite restante", value: remainingLimit },
  ];

  const donutTotal = selectedValue + remainingLimit;

  const usedPercent =
    MonthlyLimit > 0
      ? Math.min(100, Math.round((selectedValue / MonthlyLimit) * 100))
      : 0;

  const yearlyPercent =
    YEARLY_LIMIT > 0
      ? Math.min(100, Math.round((yearlySum / YEARLY_LIMIT) * 100))
      : 0;

  const deductionEvolution = 0;

  const balanceLineData = monthlyBalances.map((item) => ({
    month: item.month,
    solde: item.value || 0,
    limite: MonthlyLimit,
  }));

  const axisTick = { fontSize: 11, fill: THEME.axis };

  return (
    <div className="w-full space-y-6">
      {/* ===================================================
          SÉLECTEUR DE MOIS
      =================================================== */}

      <div className="no-scrollbar flex items-center gap-1 overflow-x-auto rounded-full border border-slate-200/70 bg-white p-1 shadow-sm dark:border-white/5 dark:bg-[#0f1a33] sm:w-fit">
        {monthlyBalances.map((month, index) => {
          const active = selectedMonthIndex === index;

          return (
            <button
              key={month.month}
              type="button"
              onClick={() => setSelectedMonthIndex(index)}
              className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b] ${
                active
                  ? "bg-[#0b1530] text-white shadow-md dark:bg-[#c9a24b] dark:text-[#0b1530]"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {month.month}
            </button>
          );
        })}
      </div>

      {/* ===================================================
          HÉRO — SOLDE DU MOIS + SYNTHÈSE
      =================================================== */}

      <section
        className="relative overflow-hidden rounded-3xl p-6 text-white shadow-[0_24px_60px_-20px_rgba(11,21,48,0.55)] sm:p-9"
        style={{
          background:
            "radial-gradient(120% 140% at 0% 0%, #1b2f66 0%, #0b1530 55%, #070e20 100%)",
        }}
      >
        {/* halo doré */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: THEME.accent }}
        />

        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          {/* Chiffre principal */}
          <div className="lg:col-span-6">
            <p className="text-sm text-white/60">
              Solde conservé · {selectedMonth?.month || "—"} {currentYear}
            </p>

            <p
              className="mt-3 text-4xl font-medium leading-none tracking-tight sm:text-6xl"
              style={{ fontFamily: SERIF }}
            >
              {selectedValue.toLocaleString("fr-FR")}
              <span className="ml-2 text-lg font-normal text-[#c9a24b] sm:text-2xl">
                FCFA
              </span>
            </p>

            <div className="mt-7 max-w-md">
              <div className="mb-2 flex justify-between text-xs text-white/60">
                <span>Plafond mensuel utilisé</span>
                <span className="font-semibold text-white">{usedPercent}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${usedPercent}%`,
                    background: `linear-gradient(90deg, ${THEME.primarySoft}, ${THEME.accent})`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Indicateurs */}
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3 lg:col-span-6">
            <div className="bg-[#0b1530]/80 p-5">
              <dt className="text-xs text-white/55">Plafond annuel</dt>
              <dd className="mt-1.5 text-base font-semibold">
                {formatMoney(YEARLY_LIMIT)}
              </dd>
            </div>

            <div className="bg-[#0b1530]/80 p-5">
              <dt className="text-xs text-white/55">Cumul annuel</dt>
              <dd className="mt-1.5 text-base font-semibold">
                {formatMoney(yearlySum)}
              </dd>
              <p className="mt-1 text-[11px] text-[#c9a24b]">
                {yearlyPercent}% du plafond
              </p>
            </div>

            <div className="bg-[#0b1530]/80 p-5">
              <dt className="text-xs text-white/55">Évolution des déductions</dt>
              <dd className="mt-1.5 flex items-center gap-2 text-base font-semibold">
                <FontAwesomeIcon
                  icon={
                    deductionEvolution > 0 ? faArrowTrendUp : faArrowTrendDown
                  }
                  className="text-xs text-[#c9a24b]"
                />
                {deductionEvolution}%
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ===================================================
          GRAPHIQUES — BARRES + DONUT
      =================================================== */}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ---------- Évolution des gains ---------- */}

        <div className={`${CARD} lg:col-span-7`}>
          <CardHeader
            icon={faChartColumn}
            title="Évolution des gains mensuels"
            subtitle={`Gains sur l'année ${currentYear}`}
          />

          <div className="h-[300px] w-full p-4 sm:h-[330px] sm:p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 5, left: -15, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={THEME.primarySoft} />
                    <stop offset="100%" stopColor={THEME.primary} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  strokeDasharray="2 6"
                  stroke={THEME.grid}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                  tickFormatter={formatCompactMoney}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "rgba(201,162,75,0.08)" }}
                />
                <Bar
                  dataKey="solde"
                  name="Gains"
                  fill="url(#gainGradient)"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- Répartition ---------- */}

        <div className={`${CARD} lg:col-span-5`}>
          <CardHeader
            icon={faChartPie}
            title="Répartition du solde"
            subtitle={selectedMonth?.month || "Mois sélectionné"}
          />

          <div className="flex flex-col items-center justify-center px-6 pb-7 pt-4">
            <div className="relative h-[200px] w-full max-w-[230px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="68%"
                    outerRadius="88%"
                    paddingAngle={3}
                    cornerRadius={8}
                    stroke="none"
                  >
                    {donutData.map((_, index) => (
                      <Cell
                        key={`donut-${index}`}
                        fill={DONUT_COLORS[index % DONUT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl font-medium text-slate-900 dark:text-white"
                  style={{ fontFamily: SERIF }}
                >
                  {formatCompactMoney(donutTotal)}
                </span>
                <span className="mt-0.5 text-[11px] text-slate-400">FCFA</span>
              </div>
            </div>

            <div className="mt-5 w-full max-w-[280px] space-y-3">
              {[
                { label: "Solde", value: selectedValue, color: THEME.primary },
                {
                  label: "Limite restante",
                  value: remainingLimit,
                  color: THEME.accent,
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      {row.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {formatMoney(row.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          SOLDE VS LIMITE
      =================================================== */}

      <div className={CARD}>
        <CardHeader
          icon={faChartLine}
          title="Solde vs limite mensuelle"
          subtitle="Comparaison du solde et du plafond mensuel"
          right={
            <div className="hidden items-center gap-5 text-xs text-slate-500 sm:flex">
              <div className="flex items-center gap-2">
                <span
                  className="h-[3px] w-6 rounded-full"
                  style={{ backgroundColor: THEME.primary }}
                />
                Solde
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-6 border-t-2 border-dashed"
                  style={{ borderColor: THEME.accent }}
                />
                Limite
              </div>
            </div>
          }
        />

        <div className="h-[300px] w-full p-4 sm:h-[360px] sm:p-6">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={balanceLineData}
              margin={{ top: 10, right: 5, left: -15, bottom: 5 }}
            >
              <defs>
                <linearGradient id="balanceArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={THEME.primary}
                    stopOpacity={0.22}
                  />
                  <stop
                    offset="100%"
                    stopColor={THEME.primary}
                    stopOpacity={0.01}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="2 6"
                stroke={THEME.grid}
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={axisTick}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={axisTick}
                tickFormatter={formatCompactMoney}
              />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="solde"
                name="Solde"
                fill="url(#balanceArea)"
                stroke="none"
              />

              <Line
                type="monotone"
                dataKey="solde"
                name="Solde"
                stroke={THEME.primary}
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: THEME.primary,
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
                activeDot={{ r: 6, fill: THEME.accent, stroke: "#fff" }}
              />

              <Line
                type="monotone"
                dataKey="limite"
                name="Limite"
                stroke={THEME.accent}
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
