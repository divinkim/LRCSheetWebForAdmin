'use client';
import AddOrEditUserPlanningOfWeek from "@/components/addEditUserPlanningOfWeek";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import useAddUserInPlanningOfWeek from "./hook";

export default function addUserInPlanningOfWeek() {
    const { handleSubmit, onSearch, usersArrayCloned, addEditUserPlanningOfWeek, weekDays, plannings, isLoading, setDatas, datas } = useAddUserInPlanningOfWeek()

    return (
        <main className="bg-gray-100 dark:bg-transparent">
            <div className="flex">
                <div className="mx-4 font-semibold mt-6 mb-4 w-full">
                    <div className="flex mb-5 justify-between items-center">
                        <h1 className="text-[20px] font-bold dark:text-gray-300 text-gray-700">
                            {addEditUserPlanningOfWeek?.addUserInPlanningOfWeek?.titlePage}
                        </h1>
                        <p className="text-blue-500">
                            {addEditUserPlanningOfWeek.addUserInPlanningOfWeek?.path}
                        </p>
                    </div>

                    <hr className='' />
                    <div className="flex justify-end space-x-4 mt-4 item-center">
                        {
                            addEditUserPlanningOfWeek.addUserInPlanningOfWeek.links.map((elm) => (
                                <Link href={elm.path} className="bg-blue-700 hover:bg-blue-800 ease rounded-md duration-500 text-white  py-3 px-8">
                                    {elm.title} <span><FontAwesomeIcon icon={elm.icon} /></span>
                                </Link>
                            ))
                        }
                    </div>
                    <div className="mt-8 grid  grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="border h-[500px] rounded-xl border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-800 px-4 py-5">

                            <div className="mb-5 px-2">
                                <div className="w-full relative">
                                    <input onChange={(e) => {
                                        onSearch(e.target.value)
                                    }}
                                        className="p-3 bg-transparent outline-none rounded-md border border-gray-400 w-full"
                                        placeholder="Recherchez un collaborateur"
                                    />
                                    <FontAwesomeIcon icon={faSearch} className="absolute right-4 top-4" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 h-[400px] overflow-auto gap-y-4 px-2">
                                {usersArrayCloned.map((user) => (
                                    <div
                                        key={user.id}
                                        className="dark:bg-gray-800/90 h-[70px] bg-white shadow-xl p-3 dark:shadow-none"
                                    >
                                        <div className='flex items-center space-x-4'>
                                            {user.photo ? (
                                                <img
                                                    className="w-10 h-10 object-cover rounded-full"
                                                    src={`${providers.APIUrl}/images/${user.photo}`}
                                                    alt={`${user.firstname} ${user.lastname}`}
                                                />
                                            ) : (
                                                <p className="text-[30px]">👤</p>
                                            )}

                                            <p className="dark:text-gray-300 text-gray-700">
                                                {user.lastname} {user.firstname}
                                            </p>

                                            <input
                                                type="checkbox"
                                                onChange={() => {
                                                    setDatas({
                                                        ...datas,
                                                        usersId: datas.usersId.includes(user.id) ? datas.usersId.filter(item => item !== user.id) : [...datas.usersId, user.id]
                                                    })
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="border h-[500px] rounded-xl border-gray-300 dark:border-gray-800 dark:bg-gray-900 bg-white p-4">
                            <div className="mb-5">
                                <select value={datas.PlanningId} onChange={(e) => {
                                    setDatas({
                                        ...datas,
                                        PlanningId: Number(e.target.value)
                                    })
                                }} className="bg-transparent border dark:text-gray-300 outline-none  dark:border-gray-800 dark:bg-gray-900 bg-white border-gray-400 w-full p-4">
                                    <option disabled selected value="">
                                        Sélectionner un planning
                                    </option>
                                    {
                                        plannings.map((planning) => (
                                            <option value={planning.id}>
                                                {planning.startTime?.slice(0, 5)} - {planning.breakingStartTime?.slice(0, 5)} - {planning.resumeEndTime?.slice(0, 5)} - {planning.endTime?.slice(0, 5)} ({planning.PlanningType.title})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>
                            <div className="px-2">
                                <h1 className="dark:text-gray-300 text-gray-700 mb-5">Les jours de la semaines</h1>
                                <hr className='bg-gray-400 border-0 h-[1px]' />
                            </div>

                            <div className="grid grid-cols-1 h-[320px] py-4 overflow-auto gap-y-4 px-2">
                                {weekDays.map((weekDay) => (
                                    <div
                                        key={weekDay.id}
                                        className="dark:bg-gray-800/90 bg-white shadow-xl p-3 dark:shadow-none"
                                    >
                                        <div className='flex items-center space-x-4'>
                                            <p className="dark:text-gray-300 text-gray-700">
                                                {weekDay.day}
                                            </p>
                                            <input
                                                type="checkbox"
                                                onChange={() => {
                                                    setDatas({
                                                        ...datas,
                                                        weekDaysId: datas.weekDaysId.includes(weekDay.id) ? datas.weekDaysId.filter(item => item !== weekDay.id) : [...datas.weekDaysId, weekDay.id]
                                                    })
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-full flex justify-end">
                        <button onClick={handleSubmit} type="button" className="mt-8 mb-5 relative rounded-md  bg-blue-600 ease duration-500 text-white py-3 px-10 hover:bg-blue-700">
                            <p className={isLoading ? "hidden" : "block"}>Ajouter</p>
                            <p className={isLoading ? 'block' : "hidden"}><ClipLoader size={16} color="#fff" /></p>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
