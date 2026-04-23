'use client';
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipLoader } from "react-spinners";
import { formElements } from "@/components/FormElements/forms";

import { providers } from "@/index";
import { cn } from "@/lib/utils";
import AddUserHookModal from "./hook";

export default function AddUser() {
    const { dynamicArrayData, staticArrayData, inputs, setInputs, isLoading, handleSubmit, adminRole } = AddUserHookModal();
    return (
        <main className="bg-gray-100 dark:bg-transparent">
            <div className="flex">
                <div className="mx-4 mt-6 mb-4 w-full font-semibold">
                    {
                        formElements.map((element) => (
                            <div className="text-gray-700 w-full space-y-4 md:space-y-0 items-center">
                                <div className="flex justify-between flex-wrap">
                                    <h1 className="font-bold mb-3 text-[20px] dark:text-gray-300 text-gray-700">Ajouter un nouveau collaborateur</h1>
                                    <p className="text-blue-700 dark:text-blue-600">Dashboard/RH/Ajouter un collaborateur</p>
                                </div>
                                <hr className='bg-gray-400' />
                                <div className="flex flex-wrap py-4 lg:space-x-4 space-y-4 items-center">
                                    {
                                        element.addOrUpdateUser.navigationLinks.map((element, index) => (
                                            <Link href={element.href} className={`bg-blue-800 hover:bg-blue-900 ease duration-500 py-3 px-4 relative top-2.5 rounded-md ${index === 0 ? "lg:top-[18px]" : index === 4 ? "lg:right-0" : index === 2 && adminRole !== "Super-Admin" ? "hidden" : ""}`}>
                                                <FontAwesomeIcon icon={element.icon} className="text-white" /> <span className='text-white'>{element.title}</span>
                                            </Link>
                                        ))
                                    }
                                </div>
                            </div>
                        ))
                    }

                    <div className='dark:border mt-8 w-full font-semibold h-auto border-gray-400 dark:border-gray-800 dark:bg-gray-900 rounded-[30px] border  dark:shadow-none p-4'>
                        {
                            formElements.map((element) => (

                                <div className="flex flex-wrap space-y-4 justify-between mb-2 items-center dark:text-gray-300 text-gray-700">
                                    <h2 className="font-bold">{element.addOrUpdateUser.addUserTitleForm}</h2>
                                    <p className="font-semibold"> <span className="text-red-600">*</span> Champs obligatoires</p>
                                </div>
                            ))
                        }
                        <hr className='bg-gray-400 border-0 h-[1px]' />
                        <div className={inputs.photo ? "block w-[150px] h-[150px] mt-5" : "hidden"}>
                            <img src={`${providers.APIUrl}/images/${inputs.photo}`} alt="" className="w-full rounded-full h-full object-cover" />
                        </div>
                        <div className='grid grid-cols-1 mt-4 gap-x-4 md:grid-cols-2 xl:grid-cols-3 font-semibold w-full'>
                            {
                                formElements.map((element) => (

                                    element.addOrUpdateUser.inputs.map((e, index) => (
                                        <div className={`w-full mb-4 ${e.alias === "adminService" && ["Super-Admin", "Supervisor-Admin, client"].includes(String(inputs.role)) ? "hidden" : "block"} ${e.alias === "status" ? "hidden" : "block"}`}>
                                            <label htmlFor="" className={`mb-3 font-semibold dark:text-gray-300 text-gray-700" ${e.alias === "adminService" && ["Super-Admin", "Supervisor-Admin, client"].includes(String(inputs.role)) ? "hidden" : "block"}`}><span className={e.requireField ? "text-red-600" : "hidden"}>*</span> {e.label}</label>
                                            {!e.selectedInput ?
                                                <input value={inputs[e.alias] ?? ""} onChange={async (v) => {
                                                    let field = e.alias;
                                                    if (e.type === "file") {
                                                        const files = v.target.files?.[0];
                                                        const response = await providers.API.post(providers.APIUrl, "sendFiles", null, { files });
                                                        if (response.status) {
                                                            setInputs({
                                                                ...inputs,
                                                                [field]: response.filename
                                                            })
                                                        }
                                                    }
                                                    setInputs({
                                                        ...inputs,
                                                        [field]: v.target.value
                                                    });
                                                    window?.localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify({ ...inputs, [field]: v.target.value }));

                                                }} type={e.type} maxLength={e.type === "tel" ? 9 : undefined} placeholder={e.placeholder} className="w-full outline-none rounded-md  dark:shadow-none p-2.5 bg-transparent border border-gray-400 dark:border-gray-300  dark:placeholder-gray-300 f dark:text-gray-300 text-gray-700 placeholder-gray-600" />
                                                :
                                                <select value={inputs[e.alias] ?? ""} onChange={(v) => {
                                                    let field = e.alias;
                                                    const fieldValue = {
                                                        ...inputs,
                                                        [field]: e.type === "number" ? parseInt(v.target.value) : v.target.value
                                                    }
                                                    setInputs(fieldValue)
                                                    localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify(fieldValue))
                                                }} name="" id="" className={cn("w-full mt-1 outline-none rounded-md  dark:shadow-none p-2.5 bg-transparent border border-gray-400 dark:border-gray-300 dark:bg-gray-900  dark:placeholder-gray-300 dark:text-gray-300 text-gray-700 placeholder-gray-700", e.alias === "adminService" && inputs.role === null ? "hidden" : "block")}>
                                                    <option value="" selected>
                                                        {e.placeholder}
                                                    </option>
                                                    {
                                                        e.dynamicOptions?.status ? dynamicArrayData
                                                            .find((item: any) => item.alias === e.alias)
                                                            ?.arrayData
                                                            ?.map((option: any) => (
                                                                <option className="text-gray-700" value={option.value}>
                                                                    {option.title}
                                                                </option>
                                                            )) :
                                                            staticArrayData.find((item: any) => item.alias === e.alias)?.arrayData.map((option: any) => (
                                                                <option value={option.value}>
                                                                    {option.title}
                                                                </option>
                                                            ))
                                                    }
                                                </select>
                                            }
                                        </div>
                                    ))
                                ))
                            }

                        </div>
                        <div className="flex w-full justify-end ">
                            <button type="button" onClick={(e) => {
                                handleSubmit()
                            }} className="bg-blue-600 my-2 hover:bg-blue-700 relative rounded-md font-semibold ease duration-500 text-white py-3 px-8">
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