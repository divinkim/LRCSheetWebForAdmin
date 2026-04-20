"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import useAddPresenceModal from "./hook";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import { useState } from "react";

export default function AddPresenceModal() {
    const { usersArray, filterUserByName, onCheckBtnEvent, handleSubmit, isLoading, setInputs, inputs, selectAllProfile, deselectAllProfile } = useAddPresenceModal();
    return (
        <div className=" bg-black/80 fixed w-screen h-[1200px] lg:h-screen overflow-hidden z-20">
            <div className="flex-1 dark:bg-gray-800 shadow-md flex duration-500 rounded-xl ease  sm:top-[20%] w-[90%] lg:w-[35%] mx-auto xl:w-[35%]  z-20 overflow-hidden  p-5  bg-gray-100 lg:ml-[200px] xl:ml-[250px] 2xl:ml-[350px] mt-10">
                <form action="" className="w-full mt-2">
                    <div className="flex justify-center">
                        <h1 className="text-center dark:text-gray-300  font-semibold text-xl mb-4">Ajouter une présence
                        </h1>
                    </div>

                    <span className="relative">
                        <span className="text-red-500 mb-1">* Champs obligatoires</span>
                    </span>
                    <div className="w-full lg:flex mt-4 flex-col">
                        <div className="flex flex-col mb-3 w-full relative">
                            <label htmlFor="" className="mb-2 dark:text-gray-300">Rechercher un collaborateur</label>
                            <input onChange={(input) => {
                                filterUserByName(input.target.value);
                            }} placeholder="Recherche..." className="border outline dark:bg-transparent border-gray-400 dark:placeholder-gray-300 dark:text-gray-300 rounded p-3 w-full outline-none" type="text" />
                            <FontAwesomeIcon icon={faSearch} className="absolute text-gray-700 dark:text-gray-300 bottom-4 right-4 " />
                        </div>
                        <div className="flex flex-col space-x-3 lg:flex-row mb-3 w-full">
                            <div className="w-full">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Arrivée <span className="text-red-500">* </span> </label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        arrivalTime: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full" type="time" />
                            </div>
                            <div className="w-full relative mt-4 lg:mt-0 right-2 lg:right-0">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Date<span className="text-red-500">* </span> </label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        createdAt: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full" type="date" />
                            </div>
                        </div>
                    </div>

                    <div className="flex mt-5 space-x-4 justify-between flex-row">
                        <div className="flex flex-col overflow-y-auto space-y-4">
                            <div className="flex space-x-2 mb-2">
                                <div>
                                    <button onClick={selectAllProfile} type="button" className="bg-blue-600 text-white font-semibold p-2.5  hover:scale-105 ease duration-500">Tout sélectionner</button>
                                </div>

                                <div>
                                    <button onClick={deselectAllProfile} type="button" className="bg-orange-500 text-white font-semibold p-2.5  hover:scale-105 ease duration-500">Tout déselectionner</button>
                                </div>
                            </div>
                            <div className='overflow-auto h-[50px]'>
                                {
                                    usersArray.map((user:any, index:number) => (
                                        <div key={index} className="flex items-center space-x-4 mb-3">
                                            <input onChange={() => {
                                                onCheckBtnEvent(user.id, user.EnterpriseId, user.SalaryId);
                                            }} type="checkbox" checked={inputs.usersId.includes(user.id)} />
                                            <div className="flex items-center space-x-2">
                                                {user.photo ? <img src={`${providers.APIUrl}/images/${user.photo} `} alt="" className="w-10 h-10 object-cover rounded-full" /> : <p className="text-[30px]">🧑‍💼</p>}
                                                <p>{user.firstname} {user.lastname}</p>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSubmit} className="bg-blue-700 ease hover:bg-blue-800 duration-500 text-white px-5 py-2 rounded mt-6" type="button">
                        <p className={isLoading ? "hidden" : "font-semibold"}> + Ajouter</p>
                        <p className={isLoading ? "block relative top-0.5" : "hidden"}>
                            <ClipLoader size={16} color="#fff" />
                        </p>
                    </button>
                </form>
            </div>
        </div>
    )
}