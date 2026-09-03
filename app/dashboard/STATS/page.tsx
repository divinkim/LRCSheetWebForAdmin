"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { AnnualGainHook } from "./hook";

// Tooltip sur mesure stylisé pour le Dark Mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        {label && <p className="mb-1 text-xs font-bold text-slate-500 dark:text-slate-400">{label}</p>}
        {payload.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
            <span className="text-slate-700 dark:text-slate-300">{item.name}:</span>
            <span className="text-slate-900 dark:text-white">
              {typeof item.value === "number" ? item.value.toLocaleString("fr-FR") + " FCFA" : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function GetAnnualGain() {
  const {
    monthlyBalances,
    MonthlyLimit,
    YEARLY_LIMIT,
    setSelectedMonthIndex,
    selectedMonth,
    yearlySum,
    COLORS,
    lineData,
    barData,
    selectedMonthIndex,
  } = AnnualGainHook();

  const currentYear = new Date().getFullYear();

  return (
    <div className="w-full space-y-6">
      {/* EN-TÊTE ET FILTRES DES MOIS */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Statistiques du gain annuel ({currentYear})
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Suivi détaillé des soldes mensuels, plafonds d'activité et tendances.
            </p>
          </div>
        </div>

        {/* Navigation des mois sous forme de Tabs scrollables */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar border-b border-slate-200/60 dark:border-slate-800">
          {monthlyBalances.map((m, index) => {
            const isActive = selectedMonthIndex === index;
            return (
              <button
                key={m.month}
                onClick={() => setSelectedMonthIndex(index)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-blue-600"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {m.month}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRILLE DES GRAPHIQUES */}
      <div id="home" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 1. PieChart mensuel */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Solde conservé — <span className="text-blue-600 dark:text-blue-400">{selectedMonth?.month}</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Répartition entre le solde actuel et la limite mensuelle fixée.
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Solde", value: selectedMonth?.value || 0 },
                    { name: "Limite restante", value: Math.max(0, MonthlyLimit - (selectedMonth?.value || 0)) },
                  ]}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  cornerRadius={4}
                >
                  {[
                    { name: "Solde", value: selectedMonth?.value || 0 },
                    { name: "Limite restante", value: Math.max(0, MonthlyLimit - (selectedMonth?.value || 0)) },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. RadialBarChart annuel */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Plafond Annuel Cumulé
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Progression du solde global par rapport à l'objectif annuel.
            </p>
          </div>

          <div className="my-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3 text-center border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total : </span>
            <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
              {yearlySum.toLocaleString("fr-FR")} FCFA
            </span>
            <span className="text-xs font-semibold text-slate-400"> / {YEARLY_LIMIT.toLocaleString("fr-FR")} FCFA</span>
          </div>

          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="30%"
                outerRadius="90%"
                data={[{ name: "Annuel", value: yearlySum, fill: "#2563eb" }]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar dataKey="value" cornerRadius={12} background={{ fill: "#f1f5f9" }} fill="#2563eb" />
                <Tooltip content={<CustomTooltip />} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. LineChart mensuel */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Évolution des Déductions
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tendance mensuelle des retenues et ajustements de solde.
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Déductions"
                  stroke="#f43f5e"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#f43f5e" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. BarChart comparatif solde vs limite */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Solde vs Limite Mensuelle
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Comparatif direct entre les revenus générés et le plafond mensuel.
            </p>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} />
                <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="solde" name="Solde" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="limite" name="Limite" fill="#64748b" opacity={0.3} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}