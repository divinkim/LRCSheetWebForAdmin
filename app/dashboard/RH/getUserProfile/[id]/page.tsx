"use client";
import { faBuilding, faCity, faCoins, faEnvelope, faGlobe, faMoneyBill1Wave, faPhone, faWallet } from "@fortawesome/free-solid-svg-icons";
import useUserProfile from "./hook";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { providers } from "@/index";

export default function getUserPofile() {
    const { user } = useUserProfile()
    return (
        <div className="min-h-screen w-full bg-gray-100 dark:bg-transparent pt-4 lg:p-6 flex justify-center">
            <div>
                <div className="mb-10">
                    <h1 className="mb-3 text-xl font-bold text-gray-700 dark:text-gray-300">Profil du collaborateur</h1>
                    <hr className="bg-gray-300 dark:bg-gray-800" />
                </div>

                <div className="lg:w-[1000px] w-full  bg-white shadow-xl rounded-2xl flex flex-col lg:flex-row overflow-hidden">

                    {/* Sidebar */}
                    <aside className="col-span-1 bg-slate-900 text-white p-6">
                        <div className="w-full flex justify-center mb-4">
                            <div className="w-[170px] h-[170px]">
                                <img src={user.photo ? `${providers.APIUrl}/images/${user.photo}` : "/images/clientProfile.png"} className="w-full h-full object-cover rounded-full" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold">{user.lastname} {user.firstname}</h1>
                        <p className="text-sm text-slate-400 mt-4 mb-6">{user.Post.title}</p>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold uppercase text-sky-400 mb-2 tracking-wider">Contact</h2>
                            <p className="text-sm mb-3"><span><FontAwesomeIcon icon={faEnvelope} /></span> {user.email}</p>
                            <p className="text-sm mb-3"><span><FontAwesomeIcon icon={faPhone} /></span> {user.phone} </p>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold uppercase text-sky-400 mb-2 tracking-wider">Salaire</h2>
                            <ul className="space-y-4 flex flex-col">
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faCoins} /></span> Salaire brute: {user.Salary?.netSalary} XAF</li>
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faMoneyBill1Wave} /></span> Salaire journalier: {user.Salary?.dailySalary} XAF</li>
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faWallet} /></span> Salaire final: {user.Salary?.netSalary} XAF</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold uppercase text-sky-400 mb-2 tracking-wider">Localité</h2>
                            <ul className="space-y-4 flex flex-col">
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faGlobe} /></span> Pays: {user?.Country?.name}</li>
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faCity} /></span> Ville: {user?.City?.name}</li>
                                <li className="bg-slate-800 px-3 py-3 rounded-md text-sm"><span><FontAwesomeIcon icon={faBuilding} /></span> Arrondissement: {user?.District?.name}</li>
                            </ul>
                        </div>
                    </aside>

                    {/* Main */}
                    <main className="p-8 dark:bg-gray-900 dark:text-gray-300">

                        {/* Profil */}
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                Poste
                            </h3>

                            <div className="mb-5">
                                <h4 className="font-semibold">{user?.Post?.title}</h4>

                                <p className="text-sm text-gray-600 mt-2">
                                    {user?.Post?.description}
                                </p>
                            </div>
                        </section>

                        {/* Expérience */}
                        <section className="mb-8">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                Contract
                            </h3>

                            <div className="mb-5">
                                <h4 className="font-semibold">Contrat de {user?.ContractType?.title}</h4>
                                <span className="text-sm text-gray-400">{user?.Contract?.startDate} - {user?.Contract?.endDate}</span>
                                <p className="text-sm text-gray-600 mt-2">
                                    {user?.ContractType?.description}
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                Planning hebdomadaire
                            </h3>

                            <div className="mb-5">
                                <h4 className="font-semibold"> {user?.PlanningType?.title}</h4>
                                <p className="text-sm text-gray-600 mt-2">
                                    {user?.PlanningType?.description}
                                </p>
                            </div>
                        </section>

                        <section className="mb-8">
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">
                                Entreprise
                            </h3>

                            <div className="mb-5">
                                <h4 className="font-semibold"> {user?.Enterprise?.name}</h4>
                                <p className="text-sm text-gray-600 mt-2">
                                    {user?.Enterprise?.description}
                                </p>
                            </div>
                        </section>

                        {/* Formation */}
                        <section>
                            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Situation matrimoniale</h3>
                            <div>
                                <p className="text-sm text-gray-600 mt-2">{user?.marialStatus}</p>
                            </div>
                        </section>

                    </main>

                </div>
            </div>
        </div>
    )
}