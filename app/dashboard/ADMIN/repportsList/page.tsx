"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faSearch,
  faPaperclip,
  faCommentDots
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { RepportsListHook } from "./hook";
import { ClipLoader } from "react-spinners";
import socket from "@/socket";

export default function Repports() {
  const {
    itemIndex,
    setItemIndex,
    isVisible,
    setIsVisible,
    itemIndexOnWriting,
    setItemIndexOnWriting,
    setAdminResponse,
    setMonthIndice,
    monthIndice,
    repportsArrayCloned,
    EnterpriseId,
    ComponentModal,
    filterRepportsByUsersNames,
    navigateBetweenMonths,
    adminResponse,
    monthsOfYear,
    RepportsArray,
    adminReportComment,
    isLoading,
    setIsLoading,
    adminReportCommentArray,
    loader,
    getAdminResponse
  } = RepportsListHook();

  const handleSendResponse = async (repport: any) => {
    try {
      setIsLoading(true);
      const adminId = localStorage.getItem("UserId") || "0";

      await adminReportComment(
        adminResponse,
        repport.id,
        repport.User.email,
        repport.UserId
      );

      socket.emit("onSendChatData", {
        path: "/Dashboard/NOTIF/chat",
        adminSectionIndex: "0",
        adminPageIndex: "0",
        receiverId: [repport.UserId],
        senderId: String(adminId)
      });

      await providers.API.post("https://vps118934.serveur-vps.net:4001", "sendMail", null, {
        senderEmail: "lrcsheet@gmail.com",
        subject: "Notification entrante",
        content: "Veuillez consulter votre messagerie sur l'espace LRCSheet Web https://vps118934.serveur-vps.net:4000/Dashboard/NOTIF/chat",
        emails: [repport.User.email]
      });

      await providers.API.post("https://vps118934.serveur-vps.net:4001", "sendNotificationPush", null, {
        path: "/dashboard/NOTIF/chat",
        EnterpriseId: String(repport.EnterpriseId ?? EnterpriseId),
        adminSectionIndex: "0",
        adminPageIndex: "0",
        senderId: String(adminId),
        receiverId: String(repport.UserId)
      });

      await providers.API.post(providers.APIUrl, "createChatMessage", null, {
        content: adminResponse,
        receiverId: repport.UserId,
        senderId: parseInt(adminId),
        EnterpriseId: parseInt(EnterpriseId ?? "1"),
        file: "",
        role: "Super-Admin"
      });

      getAdminResponse();
      setAdminResponse("");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* En-tête Pro */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-5 border-b border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {ComponentModal?.[0]?.Repport?.titlePage || "Rapports d'activités"}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Consultez et gérez les soumissions de vos collaborateurs
            </p>
          </div>
        </header>

        {/* Barre d'outils et de filtres */}
        <div className="bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Champ de Recherche */}
          <div className="relative w-full md:w-80">
            <input
              onChange={(e) => filterRepportsByUsersNames(e.target.value, monthIndice)}
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all"
              placeholder="Rechercher un collaborateur..."
            />
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          </div>

          {/* Mois Actuel */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {monthsOfYear[monthIndice]} <span className="text-slate-500 dark:text-slate-400 font-normal">{new Date().getFullYear()}</span>
            </h2>
          </div>

          {/* Actions de Navigation */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => {
                const decrementMonthIndex = monthIndice - 1;
                setMonthIndice(decrementMonthIndex);
                navigateBetweenMonths(RepportsArray, decrementMonthIndex, parseInt(EnterpriseId ?? "0"));
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 active:scale-95"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="mr-2 text-sm" />
              Précédent
            </button>

            <button
              type="button"
              onClick={() => {
                const incrementedMonthIndex = monthIndice + 1;
                setMonthIndice(incrementedMonthIndex);
                navigateBetweenMonths(RepportsArray, incrementedMonthIndex, parseInt(EnterpriseId ?? "0"));
              }}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-200 active:scale-95"
            >
              Suivant
              <FontAwesomeIcon icon={faChevronRight} className="ml-2 text-sm" />
            </button>
          </div>
        </div>

        {/* Liste des Rapports */}
        <div className="space-y-4">
          {repportsArrayCloned.length > 0 ? (
            repportsArrayCloned
              .filter((repport) => repport.monthIndice === monthIndice)
              .slice()
              .reverse()
              .map((repport, index) => {
                const isExpanded = itemIndex === index && isVisible;

                return (
                  <article
                    key={repport.id ?? index}
                    className="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                  >
                    {/* Header de la carte */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-700/40">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={
                            repport.User?.photo
                              ? `${providers.APIUrl}/images/${repport.User.photo}`
                              : "/images/clientProfile.png"
                          }
                          alt="Photo utilisateur"
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                            {repport.User?.lastname} {repport.User?.firstname}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(repport.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                              weekday: "short"
                            })} à {new Date(repport.createdAt).toLocaleTimeString([], {
                              minute: "2-digit",
                              hour: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setItemIndex(index);
                          setIsVisible(!isVisible);
                        }}
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        <span>{isExpanded ? "Réduire" : "Déplier"}</span>
                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} className="text-sm" />
                      </button>
                    </div>

                    {/* Corps du rapport */}
                    <div className="p-5 space-y-4">
                      <div>
                        <span className="text-sm font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
                          Objet
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                          {repport.title}
                        </h4>
                      </div>

                      <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-4">
                        <p
                          dangerouslySetInnerHTML={{
                            __html: isExpanded
                              ? repport.content ?? ""
                              : providers.reduceLengthOfText(repport.content, 255) ?? ""
                          }}
                          className="[&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_li]:mb-1 [&_p]:mb-3"
                        />
                      </div>

                      {/* Zone interactive (Dépliée) */}
                      {isExpanded && (
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
                          
                          {/* Commentaires existants */}
                          {adminReportCommentArray.length > 0 &&
                            adminReportCommentArray.map(
                              (item: { UserId: number; RepportId: number; content: string }, idx: number) => (
                                <div key={idx}>
                                  {item.UserId === repport.UserId && item.RepportId === repport.id && (
                                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-sm flex gap-3">
                                      <FontAwesomeIcon icon={faCommentDots} className="mt-0.5 text-amber-500" />
                                      <div>
                                        <p className="font-semibold text-sm text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                                          Commentaire Administrateur
                                        </p>
                                        <p className="mt-1">{item.content}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            )}

                          {/* Saisie de réponse */}
                          <div className="space-y-3">
                            <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                              Répondre au rapport
                            </label>
                            <textarea
                              value={itemIndexOnWriting === index ? adminResponse : ""}
                              onChange={(e) => {
                                setAdminResponse(e.target.value);
                                setItemIndexOnWriting(index);
                              }}
                              placeholder="Rédigez une observation ou un retour..."
                              className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 transition-all resize-none"
                              rows={3}
                            />

                            <button
                              onClick={() => handleSendResponse(repport)}
                              type="button"
                              disabled={isLoading}
                              className="inline-flex items-center justify-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50"
                            >
                              {isLoading ? <ClipLoader size={16} color="#fff" /> : "Envoyer le retour"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Pièces jointes */}
                      {repport.files && (
                        <div className="pt-2">
                          <a
                            href={`${providers.APIUrl}/images/${repport.files}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors border border-slate-200 dark:border-slate-600"
                          >
                            <FontAwesomeIcon icon={faPaperclip} className="text-slate-500" />
                            <span>Consulter la pièce jointe</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })
          ) : (
            /* Empty State Modernisé */
            <div className="bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-700/60 p-12 text-center">
              {repportsArrayCloned.length === 0 && !loader ? (
                <div className="max-w-xs mx-auto space-y-3">
                  <img
                    src="/images/folder.png"
                    className="w-24 h-24 mx-auto opacity-70 dark:opacity-50 grayscale"
                    alt="Aucune donnée"
                  />
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                    Aucun rapport trouvé
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Il n'y a aucune donnée disponible pour la période ou les filtres sélectionnés.
                  </p>
                </div>
              ) : (
                <div className="py-8">
                  <ClipLoader size={32} color="#2563eb" />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}