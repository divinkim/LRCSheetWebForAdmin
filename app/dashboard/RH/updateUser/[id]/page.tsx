'use client';
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
import { formElements } from "@/components/FormElements/forms";
import { FormEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { providers } from "@/index";
import { UpdateUserHookModal } from "../hook";

export default function UpdateUser() {


    const { dynamicOptions, staticOptions, setInputs, inputs, handleSubmit, isLoading, adminRole } = UpdateUserHookModal();

    return (
        <main className="bg-gray-100 text-gray-700  dark:text-gray-300 dark:bg-transparent">
            <div className="flex">
                <div className="mx-4 mt-6 mb-4 w-full font-semibold">
                    {
                        formElements.map((element) => (
                            <div className="flex-col flex-wrap text-gray-700 w-full space-y-4 md:space-y-0 items-center justify-between">
                                <div className="flex w-full justify-between flex-wrap">
                                    <h1 className="font-bold mb-3 text-[20px] dark:text-gray-300 text-gray-700">Modifier un collaborateur existant</h1>
                                    <p className="text-blue-700 dark:text-blue-600">Dashboard/RH/Modifier un collaborateur</p>
                                </div>
                                <hr className="" />
                                <div className="flex flex-wrap py-4 font-normal space-x-4 space-y-4 items-center">
                                    {
                                        element.addOrUpdateUser.navigationLinks.map((element, index) => (
                                            <Link href={element.href} className={`bg-blue-800 rounded-md hover:bg-blue-900 ease duration-500 py-3 font-semibold px-4 relative top-2.5 ${index === 2 && adminRole !== "Super-Admin" ? "hidden" : ""}`}>
                                                <FontAwesomeIcon icon={element.icon} className="text-white" /> <span className='text-white'>{element.title}</span>
                                            </Link>
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    }

                    <div className='dark:border mt-8 w-full h-auto border-gray-300 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 rounded-[30px] border  dark:shadow-none p-4'>
                        {
                            formElements.map((element) => (

                                <div className="flex flex-wrap space-y-4 justify-between mb-2 items-center dark:text-gray-300 text-gray-700">
                                    <h2 className="font-bold">{element.addOrUpdateUser.updateUserTitleForm}</h2>
                                    <p className="font-semibold"> <span className="text-red-600">*</span> Champs obligatoires</p>
                                </div>
                            ))
                        }
                        <hr className="bg-gray-400 h-[1px] border-0" />
                        <div className={inputs.photo ? "block w-[150px] mt-4 h-[150px]" : "hidden"}>
                            <img src={`${providers.APIUrl}/images/${inputs.photo}`} alt="" className="w-full rounded-full h-full object-cover" />
                        </div>
                        <div className='grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 xl:grid-cols-3 w-full'>

                            {
                                formElements.map((element) => (
                                    element.addOrUpdateUser.inputs.map((e, index) => (
                                        <div key={index} className="w-full">
                                            <div className={`w-full ${e.alias === "adminService" && ["Super-Admin", "Supervisor-Admin", "client"].includes(inputs.role ?? "") ? "hidden" : "block"}`}>
                                                <label htmlFor="" className="mb-4 font-semibold dark:text-gray-300 text-gray-700"><span className={e.requireField ? "text-red-600" : "hidden"}>*</span> {e.label}
                                                </label>
                                                {!e.selectedInput ?
                                                    <input value={e.type !== "file" ? (inputs[e.alias] ?? "") : ""} onChange={async (v) => {
                                                        for (const [key, _] of Object.entries(inputs)) {
                                                            if (key === e.alias) {
                                                                if (e.type === "file") {
                                                                    const files = v.target.files?.[0];
                                                                    const response = await providers.API.post(providers.APIUrl, "sendFiles", null, { files });
                                                                    console.log("L efichier image", response)
                                                                    if (response.status) {
                                                                        setInputs({
                                                                            ...inputs,
                                                                            [e.alias]: response.filename
                                                                        })
                                                                    }
                                                                }
                                                                setInputs({
                                                                    ...inputs,
                                                                    [e.alias]: v.target.value
                                                                })
                                                            }
                                                        }

                                                    }} type={e.type} maxLength={e.type === "tel" ? 9 : undefined} placeholder={e.placeholder} className="w-full mt-1 outline-none rounded-md font-semibold dark:shadow-none p-2.5 bg-transparent border border-gray-400 dark:border-gray-300  dark:placeholder-gray-300  dark:text-gray-300 text-gray-700" />
                                                    :
                                                    <select value={e.type !== "file" ? (inputs[e.alias] ?? "") : ""} onChange={(v) => {
                                                        for (const [key, _] of Object.entries(inputs)) {
                                                            if (key === e.alias) {
                                                                setInputs({
                                                                    ...inputs,
                                                                    [e.alias]: e.type === "number" ? parseInt(v.target.value) : v.target.value
                                                                })
                                                            } else if (e.alias === "status") {
                                                                const value = v.target.value
                                                                setInputs({
                                                                    ...inputs,
                                                                    [e.alias]: value === "Actif" ? true : value === "Inactif" ? false : null
                                                                })
                                                            }
                                                        }

                                                    }} name="" id="" className="w-full mt-1 outline-none rounded-md  dark:shadow-none p-2.5 bg-transparent border border-gray-400 dark:border-gray-300 dark:bg-gray-900 font-semibold dark:placeholder-gray-300 dark:text-gray-300 text-gray-700">
                                                        <option value="" selected disabled>
                                                            {e.placeholder}
                                                        </option>
                                                        {
                                                            e.dynamicOptions?.status ? dynamicOptions
                                                                .find(item => item.alias === e.alias)
                                                                ?.arrayData
                                                                ?.map(option => (
                                                                    <option value={option.value}>
                                                                        {option.title}
                                                                    </option>
                                                                )) :
                                                                staticOptions.find(item => item.alias === e.alias)?.arrayData.map((option) => (
                                                                    <option value={option.value}>
                                                                        {option.title}
                                                                    </option>
                                                                ))
                                                        }
                                                    </select>
                                                }
                                            </div>
                                        </div>
                                    ))
                                ))
                            }

                        </div>
                        <div className="flex w-full justify-end ">
                            <button type="button" onClick={(e) => {
                                handleSubmit()
                            }} className="bg-blue-600 my-2 hover:bg-blue-700 relative mt-5 rounded-md font-semibold ease duration-500 text-white py-2.5 px-8">
                                <p className={isLoading ? "hidden" : "block"}> Exécuter</p>
                                <p className={isLoading ? "block" : "hidden"}><ClipLoader color="#fff" size={16} /></p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    )
}