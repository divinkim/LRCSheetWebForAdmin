"use client";
import useSendRepport from "./hook";
import { ClipLoader } from "react-spinners";
import { faChevronLeft, faChevronRight, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { providers } from "@/index";
import useNotifications from "./hook";
import Link from "next/link";

export default function Notifications() {
    const { isLoading, handleSubmit, inputs, setInputs, showModal, setShowModal, users, filterUsersByFullName, onCheck, files, setFiles, filterUsersByDepartment } = useNotifications()
    return (
        <div className="bg-gray-100  dark:bg-transparent w-full">
            <div className={showModal ? "fixed w-full h-screen overflow-x-hidden bg-black/70 z-50 flex items-center justify-center" : "hidden"}>
                <div>
                    <button onClick={() => {
                        setShowModal(false)
                    }} className="absolute top-10 right-10">
                        <FontAwesomeIcon icon={faTimes} className="text-gray-300 text-[20px]" />
                    </button>
                </div>
                <div className="bg-white dark:bg-gray-900 shadow-xl dark:border-gray-600 border  rounded-lg w-[90%] relative  top-10 p-5 lg:w-[30%] h-[500px]">
                    <div className="relative">
                        <input onChange={(e) => {
                            filterUsersByFullName(e.target.value)
                        }} type="text" placeholder="Recherche des collaborateurs" className="border border-gray-400 outline-none bg-white mt-2  dark:bg-transparent p-3 w-full rounded-md" />
                        <FontAwesomeIcon icon={faSearch} className="text-[20px] text-gray-600 dark:text-gray-400 absolute top-6 right-4" />
                    </div>


                    <div className="flex  mt-5 overflow-auto  h-[400px] flex-col">
                        {
                            users.map((item, index) => (
                                item.id !== 66 && (
                                    <div key={index} className="hover:cursor-pointer hover:duration-500 border-b border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <div className="flex p-3 border-gray-400 items-center space-x-4">
                                            {item.photo ? <img src={`${providers.APIUrl}/images/${item.photo}`} className="w-[50px] h-[50px] rounded-full object-cover" /> : <p className="text-[40px]">🧑‍💼</p>}
                                            <p className="font-semibold">{item.lastname} {item.firstname}</p>
                                            <input type="checkbox" onChange={() => {
                                                onCheck(item.email)
                                            }} checked={inputs.emails.includes(item.email)} />
                                        </div>
                                        {/* <hr /> */}
                                    </div>
                                )
                            ))
                        }
                    </div>
                </div>

            </div>
            <div className="flex">
                <div className="mx-4 flex dark:text-gray-300 text-gray-700 items-center mt-6 mb-4 w-full"
                >
                    <div className="w-full">
                        <div className="flex w-full -top-4 lg:-top-2 space-y-4 mt-2 lg:space-y-0 flex-col lg:flex-row  lg:justify-between font-semibold mb-3 items-center relative">
                            <div className="flex items-center space-x-4">
                                <h1 className='font-bold text-[20px] text-gray-600 dark:text-gray-300'>Notifications</h1>
                                <div className="relative">
                                    <input onChange={(e) => {
                                        filterUsersByDepartment(e.target.value)
                                    }} type="text" placeholder="Recherche par département" className="border rounded-md border-gray-300 w-[300px] dark:bg-transparent outline-none p-3 text-gray-600 font-normal dark:border-gray-800" />
                                    <FontAwesomeIcon icon={faSearch} className="text-gray-600   absolute top-4 right-5" />
                                </div>
                                {/* <div>
                                    <Link href="" className="p-3 rounded-md text-white">Liste des notifications</Link>
                                </div> */}
                            </div>

                            <div className="lg:hidden">
                                <button onClick={() => {
                                    setShowModal(true)
                                }} className="bg-blue-600 ease duration-500 hover:bg-blue-700 text-white px-5 py-3">
                                    Collaborateurs en copie
                                </button>
                            </div>
                        </div>
                        <hr className='w-full lg:mt-0 dark:border-gray-500' />
                        <div className="flex w-full justify-center mt-10 flex-col space-y-4 lg:space-x-4 lg:flex-row lg:space-y-0">
                            <div className="bg-white  dark:bg-gray-900 overflow-auto w-1/2 h-[650px] hidden lg:block rounded-lg shadow-xl border dark:border-gray-500">
                                <h1 className="font-bold dark:text-gray-300 text-[16px] text-gray-700 py-5 px-4">Ajouter en copie d'autres collaborateurs</h1>

                                <div className="relative border-t border-gray-300 dark:border-gray-500 px-3 pt-2 mb-1">
                                    <input onChange={(e) => {
                                        filterUsersByFullName(e.target.value)
                                    }} type="text" placeholder="Recherche sur les collaborateurs" className="border border-gray-300 dark:border-gray-500 outline-none bg-white mt-2  dark:bg-transparent p-3 w-full rounded-md" />
                                    <FontAwesomeIcon icon={faSearch} className="text-[20px] absolute text-gray-600 top-[30px] right-5" />
                                </div>
                                <div className="">
                                    {
                                        users.map((item, index) => (
                                            item.id !== 66 && (
                                                <div key={index} className="hover:cursor-pointer hover:duration-500 border-b border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                                                    <div className="flex p-3 border-gray-400 items-center space-x-4">
                                                        {item.photo ? <img src={`${providers.APIUrl}/images/${item.photo}`} className="w-[50px] h-[50px] rounded-full object-cover" /> : <p className="text-[40px]">🧑‍💼</p>}
                                                        <p className="font-semibold">{item.lastname} {item.firstname}</p>
                                                        <input type="checkbox" onChange={() => {
                                                            onCheck(item.email)
                                                        }} checked={inputs.emails.includes(item.email)} />
                                                    </div>
                                                    {/* <hr /> */}
                                                </div>
                                            )

                                        ))
                                    }
                                </div>
                            </div>
                            <div className="w-full sm:w-[95%] relative  lg:w-2/3 mx-auto p-5  lg:h-[650px] border shadow-xl dark:bg-gray-900 bg-white  dark:border-gray-500 rounded-xl flex flex-col space-y-4">
                                <div>
                                    <label htmlFor="" className="font-semibold">Objet</label>
                                    <input value={inputs.title} onChange={(e) => {
                                        setInputs({
                                            ...inputs,
                                            title: e.target.value
                                        })
                                    }} placeholder="Saisissez un titre" className="w-full border mt-3 outline-none bg-transparent dark:border-gray-500 bg-white dark:bg-transparent p-3 rounded-md" />

                                </div>
                                <div>
                                    <label htmlFor="" className="font-semibold">Contenu</label>
                                    <textarea value={inputs.content} onChange={(e) => {
                                        setInputs({
                                            ...inputs,
                                            content: e.target.value
                                        })
                                    }} placeholder="Saisissez un titre" className="w-full border mt-3 outline-none h-[300px] dark:border-gray-500 bg-white dark:bg-transparent p-3 bg-transparent rounded-md"></textarea>
                                </div>
                                <div className="flex flex-col space-y-4 lg:flex-row w-full lg:items-center lg:space-y-0 lg:justify-between">
                                    <div className="flex flex-row items-center space-y-3">
                                        <label className="cursor-pointer flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">

                                            <div className="flex flex-col items-center space-y-2">
                                                <span className="text-3xl">📁</span>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    Cliquez pour choisir un fichier
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    PNG, JPG ou PDF
                                                </p>
                                            </div>

                                            <input
                                                type="file"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    const result = await providers.API.post(providers.APIUrl, "sendFile", null, { file });
                                                    setFiles(result.filename);
                                                }}
                                            />
                                        </label>

                                        {/* Aperçu du fichier */}
                                        {files && (
                                            <div className="flex items-center relative left-2 lg:left-4 -top-3 space-x-3 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg">
                                                <span>📄</span>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                                    {files.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={handleSubmit} className="bg-blue-600 h-[50px] ease duration-500 hover:bg-blue-700 rounded-md text-white py-3 px-5 font-semibold">{isLoading ? <ClipLoader color="#fff" size={16} /> : "Envoyer"}</button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div >
    )
}