"use client";
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    RadialBarChart, RadialBar,
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar
} from "recharts";

import { AnnualGainHook } from "./hook";

export default function GetAnnualGain() {

    const { monthlyBalances, MonthlyLimit, YEARLY_LIMIT, setSelectedMonthIndex, selectedMonth, yearlySum, COLORS, lineData, barData, EnterpriseId, adminRole, attendances, selectedMonthIndex } = AnnualGainHook();

    return (
        <main className="bg-gray-100 dark:bg-transparent">
            <div className="flex min-w-0">
                <div className="mx-4 mt-6 my-4 w-full min-w-0">
                    <div className="flex justify-between items-center mb-5">
                        <h1 className="text-[20px] font-bold text-gray-700 dark:text-gray-300">Statistique du gain annuel ({new Date().getFullYear()})</h1>
                        <p className="text-blue-700 hidden dark:text-blue-600">Dashboard / Statistiques / Gain annuel</p>
                    </div>
                    <hr className='bg-gray-200 border-0 h-[0.5px] dark:bg-gray-700' />

                    {/* Boutons de mois */}
                    <div className="flex gap-3 flex-wrap mt-5">
                        {monthlyBalances.map((m, index) => (
                            <button
                                key={m.month}
                                onClick={() => setSelectedMonthIndex(index)}
                                className={`px-4 py-2 rounded  ${selectedMonthIndex === index ? "bg-blue-600 text-white" : "bg-white shadow-xl dark:shadow-none dark:bg-gray-800/50 dark:text-gray-300"}`}
                            >
                                {m.month}
                            </button>
                        ))}
                    </div>

                    {/* Grille de graphiques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 min-w-0">
                        {/* PieChart mensuel */}
                        <div className="p-4 shadow-xl dark:text-gray-300 bg-white rounded-xl  dark:shadow-none  dark:bg-gray-900 border-gray-300 dark:border-gray-800 border">
                            <h2 className="text-lg font-bold my-4 text-center">Solde conservé en {selectedMonth.month}</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[{ name: "Solde", value: selectedMonth.value }, { name: "Limite", value: MonthlyLimit - selectedMonth.value }]}
                                        dataKey="value"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        label
                                    >
                                        {[
                                            { name: "Solde", value: selectedMonth.value },
                                            { name: "Limite", value: MonthlyLimit - selectedMonth.value }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* RadialBarChart annuel */}
                        <div className="p-4 shadow-xl dark:text-gray-300 dark:shadow-none dark:bg-gray-900  border-gray-300 dark:border-gray-800 border  rounded-xl bg-white">
                            <h2 className="text-lg font-bold my-4 text-center">Solde total par rapport au plafond annuel</h2>
                            <div className="text-center mb-2">
                                <strong>Total annuel :</strong> {yearlySum.toLocaleString() + " FCFA"} / {YEARLY_LIMIT.toLocaleString() + " FCFA"}
                            </div>
                            <ResponsiveContainer width="100%" height={300}>
                                <RadialBarChart
                                    innerRadius="10%"
                                    outerRadius="80%"
                                    data={[{ name: "Annuel", value: yearlySum, fill: "#1e90ff" }]}
                                    startAngle={180}
                                    endAngle={0}
                                >
                                    <RadialBar
                                        dataKey="value"
                                        cornerRadius={15}
                                        background
                                        fill="#1e90ff"
                                    />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* LineChart mensuel */}
                        <div className="p-4 shadow-xl dark:shadow-none dark:bg-gray-900 border-gray-300 dark:border-gray-800 border dark:text-gray-300  bg-white rounded-xl">
                            <h2 className="text-lg font-bold my-4 text-center">Évolution mensuelle des déductions</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={lineData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tick={{ fontSize: 13 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#ff6b81" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* BarChart comparatif solde vs limite */}
                        <div className="p-4 shadow-xl bg-white rounded-xl dark:text-gray-300  dark:shadow-none dark:bg-gray-900 border-gray-300 dark:border-gray-800 border">
                            <h2 className="text-lg font-bold my-4 text-center">Comparatif solde / limite mensuelle</h2>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={barData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tick={{ fontSize: 13 }} />
                                    <Tooltip />
                                    <Bar dataKey="solde" fill="#2ed573" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="limite" fill="#ff4757" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
