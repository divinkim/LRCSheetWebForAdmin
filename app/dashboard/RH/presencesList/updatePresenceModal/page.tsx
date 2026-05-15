"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { PresencesListHookModal } from "../hook";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import { useState, useEffect } from "react";

type UpdatePresence = {
    usersId: number[],
    arrivalTime: string | null,
    departureTime: string | null,
    resumeTime: string | null,
    breakStartTime: string | null,
    enterprisesId: any[],
    salariesId: any[],
    planningsId: any[],
    date: string,
}

export default function UpdatePresenceModal() {
    const { onSelectAllUser, users, usersCloned, setUsersCloned } = PresencesListHookModal();
    const [isLoading, setIsLoading] = useState(false);

    const [inputs, setInputs] = useState<UpdatePresence>({
        usersId: [],
        arrivalTime: null,
        breakStartTime: null,
        resumeTime: null,
        departureTime: null,
        salariesId: [],
        enterprisesId: [],
        planningsId: [],
        date: "",
    });

    function includesValue(array: number[], value: number) {
        const result = array.includes(value) ? array.filter(item => item !== value) : [...array, value];
        return result;
    }

    function onSelect(UserId: number, SalaryId: number, PlanningId: number, EnterpriseId: number) {
        setInputs({
            ...inputs,
            usersId: includesValue(inputs.usersId, UserId),
            salariesId: [...inputs.salariesId, SalaryId],
            planningsId: [...inputs.planningsId, PlanningId],
            enterprisesId: [...inputs.enterprisesId, EnterpriseId],
        })
    }

    function selectAllUser() {
        setInputs({
            ...inputs,
            usersId: onSelectAllUser().getUsersId,
            salariesId: onSelectAllUser().getSalariesId,
            planningsId: onSelectAllUser().getPlanningId,
            enterprisesId: onSelectAllUser().getEnterprisesId
        })
    }

    function deselectAllUser() {
        setInputs({
            ...inputs,
            usersId: [],
            salariesId: [],
            planningsId: [],
            enterprisesId: []
        })
    }


    function onSearch(e: string) {
        const newUsersArray = users.filter(item => item?.lastname?.toLowerCase().includes(e.toLowerCase()) || item?.firstname?.toLowerCase().includes(e.toLowerCase()));
        setUsersCloned(newUsersArray);
    }

    const handleSubmit = async () => {
        setIsLoading(true);

        console.log(inputs)

        if (!inputs.date) {
            return setTimeout(() => {
                providers.alertMessage(
                    false, "Champs invalides", "Veuillez saisir la date à modifier", null
                );
                setIsLoading(false);
            }, 1000)
        }

        const response = await providers.API.post("https://vps118934.serveur-vps.net:4001",
            "postAttendancesFromAdmin",
            null,
            inputs,
        );

        const status = response.status;
        const title = response.title;
        const message = response.message;
        const path = status ? "/dashboard/RH/presencesList" : null;

        setIsLoading(false);

        providers.alertMessage(status, title, message, path);

        if (status) {
            setInputs({
                usersId: [],
                arrivalTime: null,
                breakStartTime: null,
                resumeTime: null,
                departureTime: null,
                salariesId: [],
                enterprisesId: [],
                planningsId: [],
                date: "",
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
                            onSearch(e.target.value)
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
                                        date: e.target.value
                                    })
                                }} className="border dark:bg-transparent border-gray-400 outline-none dark:text-gray-300 rounded p-3 w-full" type="date" />
                            </div>
                        </div>
                    </div>

                    <div className="flex mt-5 space-x-4 justify-between flex-row">
                        <div className="flex flex-col overflow-y-auto space-y-4">
                            <div className="flex space-x-2 mb-2 font-semibold">
                                <div>
                                    <button onClick={selectAllUser} type="button" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md ease duration-500 font-semibold">Tout sélectionner</button>
                                </div>

                                <div>
                                    <button onClick={deselectAllUser} type="button" className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-md ease duration-500 font-semibold">Tout déselectionner</button>
                                </div>
                            </div>
                            <div className='h-[50px]'>
                                {
                                    usersCloned.map((user) => (
                                        <div className="flex flex-row space-y-4 mb-4 dark:text-gray-300 items-center space-x-3">
                                            <img src={user?.photo ? `${providers.APIUrl}/images/${user?.photo}` : "/images/clientProfile.png"} className="w-10 h-10 object-cover rounded-full" alt="" />
                                            <p>{providers.reduceLengthOfText(String(user?.firstname), 5)} {user?.lastname}</p>
                                            <input checked={inputs.usersId.includes(user.id)} className="dark:bg-transparent" type="checkbox" value={user.id ?? ""} onChange={() => {
                                                onSelect(user.id, user.SalaryId, user.PlanningId, user.EnterpriseId);
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