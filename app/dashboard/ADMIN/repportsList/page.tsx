"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faSearch } from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { RepportsListHook } from "./hook";
import { ClipLoader } from "react-spinners";

export default function Repports() {
    const { itemIndex, setItemIndex, isVisible, setIsVisible, itemIndexOnWriting, setItemIndexOnWriting, setAdminResponse, setMonthIndice, monthIndice, repportsArrayCloned, EnterpriseId, ComponentModal, filterRepportsByUsersNames, navigateBetweenMonths, adminResponse, monthsOfYear, RepportsArray, adminReportComment, isLoading, setIsLoading, adminReportCommentArray } = RepportsListHook();

    return (
        <main className="bg-gray-100 dark:bg-transparent">
            <div className="flex">
                <div className="mx-4 dark:text-gray-300 text-gray-700 mt-6 mb-4 w-full">
                    <div className="flex justify-between font-semibold mb-4 items-center">
                        <h1 className='font-bold text-[20px]'>{ComponentModal?.[0].Repport?.titlePage}</h1>
                        <p className="hidden lg:block text-blue-600">{ComponentModal?.[0].Repport?.path}</p>
                    </div>
                    <hr className='' />
                    <div className="flex lg:justify-between mt-5 items-center flex-col space-y-4 lg:flex-row lg:space-y-0">
                        <div className='relative w-[300px]'>
                            <input onChange={(e) => {
                                filterRepportsByUsersNames(e.target.value, monthIndice)
                            }} type="text" className="bg-transparent border border-gray-400 p-3 rounded-md outline-none w-full" placeholder="Recherche par collaborateurs..." />
                            <FontAwesomeIcon icon={faSearch} className="absolute top-4 right-4 text-gray-400" />
                        </div>
                        <div>
                            <h1 className="text-[20px] dark:text-gray-300 font-bold">{monthsOfYear[monthIndice]} {new Date().getFullYear()}</h1>
                        </div>
                        <div className="flex item-center font-semibold text-white space-x-4">
                            <button type="button" onClick={() => {
                                const decrementMonthIndex = monthIndice - 1;
                                setMonthIndice(decrementMonthIndex);
                                navigateBetweenMonths(RepportsArray, decrementMonthIndex, parseInt(EnterpriseId ?? ""))
                            }} className="bg-orange-500/90 hover:scale-105 ease duration-500 px-6 py-2"><span className="relative top-[1px]"><FontAwesomeIcon icon={faChevronLeft} /></span>Précédent</button>
                            <button type="button" onClick={() => {
                                const incrementedMonthIndex = monthIndice + 1;
                                setMonthIndice(incrementedMonthIndex)
                                navigateBetweenMonths(RepportsArray, incrementedMonthIndex, parseInt(EnterpriseId ?? ""))
                            }} className="bg-blue-600 px-6 py-3 hover:scale-105 ease duration-500">Suivant<span className="relative top-[1px]"><FontAwesomeIcon icon={faChevronRight} /></span></button>
                        </div>
                    </div>
                    <div className="mx-auto mt-8 w-full">
                        {
                            repportsArrayCloned.filter(repport => repport.monthIndice === monthIndice).slice().reverse().map((repport, index) => (
                                <div className="w-full h-auto bg-white shadow-xl mb-6 dark:shadow-none dark:border dark:border-gray-400 p-4 rounded-xl dark:bg-transparent">
                                    <div className="flex justify-start items-center lg:justify-between flex-col lg:flex-row space-y-5 lg:space-y-0">
                                        <div className="flex items-center space-x-4">
                                            {
                                                <img src={repport.User.photo ? `${providers.APIUrl}/images/${repport.User.photo}` : "/images/clientProfile.png"} alt="" className="rounded-full w-[50px] h-[50px] object-cover" />
                                            }

                                            <h1 className="font-bold">{repport.User?.lastname} {repport.User?.firstname}</h1>
                                        </div>
                                        <div onClick={() => {
                                            setItemIndex(index);
                                            setIsVisible(!isVisible)
                                        }} className="cursor-pointer bg-blue-600 hover:bg-blue-600 text-white ease duration-500 rounded-full px-4 py-2">
                                            <p>{itemIndex === index && isVisible ? "Voir moins" : "Voir plus"} <span className=""><FontAwesomeIcon className="" icon={itemIndex === index && isVisible ? faChevronUp : faChevronDown} />
                                            </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="my-6 flex flex-col space-y-2 font-bold">
                                        <h1> Objet: {repport.title}</h1>
                                        <h1>Date: {new Date(repport.createdAt).toLocaleDateString('fr-Fr', {
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric",
                                            weekday: "short"
                                        })}</h1>
                                        <hr className='bg-gray-400 border-0 h-[1px]' />
                                        <div className="flex flex-col space-y-5 pt-4">
                                            <p className="font-normal leading-loose  dark:text-gray-300  whitespace-pre-wrap">{itemIndex === index && isVisible ? repport.content : providers.reduceLengthOfText(repport.content, 255)}
                                            </p>

                                            <div className={itemIndex === index && isVisible ? "relative -top-2" : "hidden"}>
                                                {
                                                    adminReportCommentArray.length > 0 ? adminReportCommentArray.map((item: { UserId: number, RepportId: number, content: string }) => (
                                                        <div className="mb-4">
                                                            <p className={item.UserId === repport.UserId && item.RepportId === repport.id ? "rounded-md border border-gray-400 p-4" : "hidden"}>
                                                                Commentaire de l'administrateur: <span className="font-normal">{item.content}</span>
                                                            </p>
                                                        </div>
                                                    )) : ""
                                                }
                                                <textarea value={itemIndexOnWriting === index ? adminResponse : ""} onChange={(e) => {
                                                    setAdminResponse(e.target.value);
                                                    setItemIndexOnWriting(index)
                                                }} name="" id="" placeholder="Laissez un commentaire!" className="w-full bg-transparent  border border-gray-400 my-4 rounded-md dark:text-gray-300 placeholder-gray-600 dark:placeholder-gray-300  h-[100px] p-4 outline-none">
                                                </textarea>
                                                <button onClick={async () => {
                                                    const comment = adminReportComment(adminResponse, repport.id, repport.User.email, repport.UserId);

                                                    const mail = await providers.API.post(providers.APIUrl, "sendMail", null, {
                                                        senderEmail: "lrcsheet@gmail.com",
                                                        subject: "Notification entrante",
                                                        content: "Veuillez consulter votre message au niveau de l'espace web LRCSheet.",
                                                        emails: [repport.User.email],
                                                    });

                                                    const notification = await providers.API.post(providers.APIUrl, "sendNotificationToWebUser", null, {
                                                        path: "/dashboard/NOTIF/chat",
                                                        EnterpriseId: repport.EnterpriseId,
                                                        adminSectionIndex: 0,
                                                        adminPageIndex: 0,
                                                        senderId: 40,
                                                        receiverId: repport.UserId
                                                    })

                                                    const chat = await providers.API.post(providers.APIUrl, "createChatMessage", null, {
                                                        content: adminResponse,
                                                        receiverId: repport.UserId,
                                                        senderId: 40,
                                                        EnterpriseId: 1,
                                                        file: "",
                                                        role: "Super-Admin",
                                                    });

                                                    setIsLoading(false);

                                                    console.log(mail);
                                                    console.log(notification);
                                                    console.log(chat);
                                                    console.log(comment);

                                                    providers.alertMessage(chat.status, chat.title, chat.message, chat.status ? "/dashboard/ADMIN/repportsList" : null);
                                                }} type="button" className="text-white bg-blue-600 rounded-md hover:bg-blue-600 w-[100px] py-2">
                                                    {isLoading ? <ClipLoader size={16} color="#fff" /> : "Envoyer"}
                                                </button>
                                            </div>
                                            <div className={repport.files !== null ? "block" : "hidden"}>
                                                <a href={`${providers.APIUrl}/images/${repport.files}`} target="_blank">
                                                    <img src="/images/fileIcone.png" className="w-[50px] h-[50px] object-contain" />
                                                    <p className="mb-1 text-blue-700  underline">Fichier joint!</p>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>

        </main >
    )
}