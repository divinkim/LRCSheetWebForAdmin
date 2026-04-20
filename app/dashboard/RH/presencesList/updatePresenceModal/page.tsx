"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { PresencesListHookModal } from "../hook";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import { useState } from "react";

type UpdatePresence = {
    usersIds: number[],
    arrivalTime: string | null,
    departureTime: string | null,
    resumeTime: string | null,
    breakStartTime: string | null,
    createdAt: string | null,
}

export default function UpdatePresenceModal() {
    const { presencesListCloned, onSearch, onSelectAllUser, } = PresencesListHookModal();
    const [isLoading, setIsLoading] = useState(false);

    const [inputs, setInputs] = useState<UpdatePresence>({
        usersIds: [],
        arrivalTime: null,
        breakStartTime: null,
        resumeTime: null,
        departureTime: null,
        createdAt: null,
    });

    function onSelect(UserId: number) {
        setInputs({
            ...inputs,
            usersIds: inputs.usersIds.includes(UserId) ? inputs.usersIds.filter(item => item !== UserId) : [...inputs.usersIds, UserId],
        })
    }


    function selectAllUser() {
        setInputs({
            ...inputs,
            usersIds: onSelectAllUser().getUsersIds
        })
    }

    function deselectAllUser() {
        setInputs({
            ...inputs,
            usersIds: [],
        })
    }

    const handleSubmit = async () => {
        setIsLoading(true);

        if (!inputs.createdAt) {
            return setTimeout(() => {
                providers.alertMessage(
                    false, "Champs invalides", "Veuillez saisir la date à modifier", null
                );
                setIsLoading(false);
            }, 1000)
        }

        const response = await providers.API.update(providers.APIUrl, "updateAttendance", null, inputs, "")

        const status = response.status;
        const title = response.title;
        const message = response.message;
        const path = status ? "/dashboard/RH/presencesList" : null

        providers.alertMessage(status, title, message, path);
        setIsLoading(false);
        if (status) {
            setInputs({
                usersIds: [],
                arrivalTime: "",
                breakStartTime: "",
                resumeTime: "",
                departureTime: "",
                createdAt: ""
            })
        }
    }

    return (
        <div className=" bg-black/80 fixed w-screen h-[1200px] lg:h-screen overflow-hidden z-20">
            <div className="flex-1 dark:bg-gray-800 mt-5 shadow-md flex duration-500 rounded-xl ease sm:top-[20%] 2xl:top-[15%] w-[90%] lg:w-[35%] mx-auto xl:w-[35%]  z-20 overflow-hidden lg:ml-[200px] xl:ml-[250px] 2xl:ml-[350px] p-5  bg-gray-100 2">
                <form action="" className="w-full mt-2">
                    <h1 className="text-center dark:text-gray-300  font-semibold text-xl mb-4">Modifier une présence
                    </h1>
                    <div className="flex flex-col mb-3 w-full relative">
                        <label htmlFor="" className="mb-2 dark:text-gray-300">Rechercher un collaborateur</label>
                        <input placeholder="Recherche..." className="border outline dark:bg-transparent border-gray-400 dark:placeholder-gray-300 dark:text-gray-300 rounded p-3 w-full outline-none" onChange={(e) => {
                            onSearch(e.target.value, "")
                        }} type="text" />
                    </div>
                    <div className="w-full lg:flex mt-4 flex-col">
                        <div className="flex flex-col space-x-3 lg:flex-row mb-3 w-full">
                            <div className="w-full">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Arrivée </label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        arrivalTime: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full"
                                    type="time" />
                            </div>
                            <div className="w-full relative right-2 lg:right-0 mt-4 lg:mt-0">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Pause</label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        breakStartTime: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full"
                                    type="time" />
                            </div>
                        </div>
                        <div className="flex flex-col space-x-3 lg:flex-row mb-3 w-full">
                            <div className="w-full">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Reprise </label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        resumeTime: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full" type="time" />
                            </div>
                            <div className="w-full relative right-2 lg:right-0 mt-4 lg:mt-0">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Départ</label>
                                <input onChange={(e) => {
                                    setInputs({
                                        ...inputs,
                                        departureTime: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full"
                                    type="time" />
                            </div>
                            <div className="w-full relative right-2 lg:right-0 mt-4 lg:mt-0">
                                <label htmlFor="" className="mb-2 dark:text-gray-300">Date</label>
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
                            <div className="flex space-x-2 mb-2 font-semibold">
                                <div>
                                    <button onClick={selectAllUser} type="button" className="bg-green-600 text-white p-2 rounded-md hover:scale-105 ease duration-500 font-semibold">Tout sélectionner</button>
                                </div>

                                <div>
                                    <button onClick={deselectAllUser} type="button" className="bg-red-600 text-white p-2 rounded-md hover:scale-105 ease duration-500 font-semibold">Tout déselectionner</button>
                                </div>
                            </div>
                            <div className='h-[50px]'>
                                {
                                    presencesListCloned.map((user) => (
                                        <div className="flex flex-row space-y-4 mb-4 dark:text-gray-300 items-center space-x-3">
                                            {user.User?.photo ? <img src={`${providers.APIUrl}/images/${user?.User?.photo}`} className="w-10 h-10 object-cover rounded-full" alt="" /> : <p className="text-[40px]"> 👮</p>}
                                            <p>{user?.User?.firstname?.slice(0, 5) + "..."} {user?.User?.lastname}</p>
                                            <input checked={inputs.usersIds.includes(user.UserId)} className="dark:bg-transparent" type="checkbox" value={user.UserId ?? ""} onChange={(e) => {
                                                onSelect(user.UserId);
                                            }} />
                                        </div>
                                    ))
                                }
                            </div>
                        </div>


                    </div>
                    <button className="bg-blue-700 ease hover:bg-blue-800 duration-500 text-white px-5 py-2 rounded mt-6" type="button" onClick={() => {
                        handleSubmit()
                    }}>
                        <p className={isLoading ? "hidden" : "block font-semibold"}>Modifier</p>
                        <p className={isLoading ? "block relative top-0.5" : "hidden"}>
                            <ClipLoader size={16} color="#fff" />
                        </p>
                    </button>
                </form>
            </div>
        </div>
    )
}