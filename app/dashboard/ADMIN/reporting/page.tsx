
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faSearch,
  faPaperclip,
  faCommentDots,
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
    getAdminResponse,
    adminId
  } = RepportsListHook();

  const handleSendResponse = async (repport: any) => {
    try {
      if (!adminResponse.trim()) return;

      setIsLoading(true);

      await adminReportComment(
        adminResponse,
        repport.id,
        repport.User.email,
        repport.UserId
      );

      // socket.emit("onSendChatData", {
      //   path: "/Dashboard/NOTIF/chat",
      //   adminSectionIndex: "0",
      //   adminPageIndex: "0",
      //   receiverId: [repport.UserId],
      //   senderId: String(adminId),
      // });

      await providers.API.post(
        providers.APIUrl,
        "notification-push",
        null,
        {
          title: "Retour suite à votre rapport",
          content: `Vous avez reçu un commentaire de la part de votre administrateur suite à votre rapport. </br> <<${adminResponse}>>`,
          EnterpriseId: String(repport.EnterpriseId ?? EnterpriseId),
          adminSectionIndex: "0",
          adminPageIndex: "0",
          senderId: String(adminId),
          receiverId: String(repport.UserId),
        }
      );

      await getAdminResponse();
      setAdminResponse("");
    } catch (error) {
      console.error("Erreur lors de l'envoi de la réponse:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  const currentMonthReports = repportsArrayCloned.filter(
    (report) =>
      report.monthIndice === monthIndice &&
      new Date(report.createdAt).getFullYear() === currentYear
  );

  const toggleReport = (index: number) => {
    const isCurrentlyExpanded = itemIndex === index && isVisible;

    setItemIndex(index);
    setIsVisible(!isCurrentlyExpanded);
  };

  const navigateMonth = (direction: number) => {
    const nextMonth = monthIndice + direction;

    if (nextMonth < 0 || nextMonth >= monthsOfYear.length) return;

    setMonthIndice(nextMonth);

    navigateBetweenMonths(
      RepportsArray,
      nextMonth,
      parseInt(EnterpriseId ?? "0")
    );

    setIsVisible(false);
    setItemIndex(-1);
  };

  return (
    <main className="min-h-screen bg-[#F4F6F9] dark:bg-[#111827] text-[#374151] dark:text-gray-100 px-3 py-5 sm:px-5 lg:px-8 lg:py-8">

      <div className="max-w-7xl mx-auto space-y-7">

        {/* =====================================================
            EN-TÊTE
        ====================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700 shadow-sm">

          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#FFAB02]" />

          <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full bg-[#359ADE]/5 blur-3xl pointer-events-none" />

          <div className="relative p-5 sm:p-7 lg:p-8">

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">

              <div className="space-y-3">

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFAB02]/10 text-[#D99000] dark:text-[#FFAB02] text-xs font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFAB02]" />
                  ESPACE ADMINISTRATION
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                    {ComponentModal?.[0]?.Repport?.titlePage ||
                      "Rapports d'activités"}
                  </h1>

                  <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl leading-relaxed">
                    Centralisez les activités de vos collaborateurs,
                    consultez leurs rapports et partagez vos observations
                    directement depuis votre espace de gestion.
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-[#F4F8FC] dark:bg-gray-900/60 border border-[#359ADE]/10 min-w-fit">

                <div className="w-11 h-11 rounded-xl bg-[#359ADE]/10 flex items-center justify-center text-[#359ADE]">
                  <span className="text-xl font-bold">R</span>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Période consultée
                  </p>

                  <p className="text-base font-bold text-gray-900 dark:text-white capitalize">
                    {monthsOfYear[monthIndice]} {currentYear}
                  </p>
                </div>

              </div>

            </div>

            {/* Indicateurs */}

            <div className="mt-7 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-[#359ADE]/10 flex items-center justify-center">
                  <span className="text-[#359ADE] font-bold text-lg">
                    #
                  </span>
                </div>

                <div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white tabular-nums">
                    {loader ? "..." : currentMonthReports.length}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rapports pour cette période
                  </p>
                </div>

              </div>

              <div className="flex items-center gap-3 sm:border-l sm:border-gray-200 sm:dark:border-gray-700 sm:pl-6">

                <div className="w-10 h-10 rounded-xl bg-[#FFAB02]/10 flex items-center justify-center">
                  <span className="text-[#D99000] dark:text-[#FFAB02] font-bold text-lg">
                    {monthIndice + 1}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {monthsOfYear[monthIndice]}
                  </p>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mois actuellement sélectionné
                  </p>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* =====================================================
            RECHERCHE ET NAVIGATION
        ====================================================== */}

        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-5">

          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">

            {/* Recherche */}

            <div className="w-full xl:max-w-md">

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                Rechercher un collaborateur
              </label>

              <div className="relative">

                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  onChange={(e) =>
                    filterRepportsByUsersNames(
                      e.target.value,
                      monthIndice
                    )
                  }
                  placeholder="Nom, prénom du collaborateur..."
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none transition-all focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10"
                />

              </div>

            </div>

            {/* Navigation mensuelle */}

            <div className="w-full xl:w-auto">

              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 xl:text-center">
                Navigation temporelle
              </label>

              <div className="flex items-center gap-2">

                <button
                  type="button"
                  disabled={monthIndice <= 0}
                  onClick={() => navigateMonth(-1)}
                  className="w-12 h-12 shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mois précédent"
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div className="flex-1 min-w-0 sm:min-w-[180px] h-12 px-4 rounded-xl bg-[#359ADE]/5 border border-[#359ADE]/15 flex items-center justify-center">

                  <div className="text-center min-w-0">
                    <p className="text-sm font-extrabold text-[#287FB5] dark:text-[#55B8F0] capitalize truncate">
                      {monthsOfYear[monthIndice]}
                    </p>

                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {currentYear}
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  disabled={monthIndice >= monthsOfYear.length - 1}
                  onClick={() => navigateMonth(1)}
                  className="w-12 h-12 shrink-0 rounded-xl bg-[#359ADE] hover:bg-[#2787C1] text-white transition-all shadow-sm shadow-[#359ADE]/20 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Mois suivant"
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            LISTE DES RAPPORTS
        ====================================================== */}

        <section className="space-y-5">

          <div className="flex items-center justify-between gap-3">

            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                Rapports soumis
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Consultez les différentes soumissions de vos équipes.
              </p>
            </div>

            {!loader && (
              <span className="shrink-0 px-3 py-1.5 rounded-full bg-[#359ADE]/10 text-[#2787C1] dark:text-[#55B8F0] text-xs font-bold">
                {currentMonthReports.length} rapport(s)
              </span>
            )}

          </div>

          {/* CHARGEMENT */}

          {loader ? (

            <div className="space-y-4">

              {Array.from({ length: 3 }).map((_, index) => (

                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 animate-pulse"
                >

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-2 flex-1">
                      <div className="w-40 h-4 rounded bg-gray-200 dark:bg-gray-700" />
                      <div className="w-28 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="w-20 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="w-2/3 h-5 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="w-full h-3 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="w-5/6 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                  </div>

                </div>

              ))}

            </div>

          ) : currentMonthReports.length > 0 ? (

            <div className="space-y-4">

              {currentMonthReports.map((repport: any, index: number) => {

                const isExpanded =
                  itemIndex === index && isVisible;

                const userName =
                  `${repport.User?.lastname ?? ""} ${repport.User?.firstname ?? ""}`.trim();

                return (

                  <article
                    key={repport.id ?? index}
                    className={`group relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 ${isExpanded
                        ? "border-[#359ADE]/50 shadow-lg shadow-[#359ADE]/5"
                        : "border-gray-200 dark:border-gray-700 shadow-sm hover:border-[#359ADE]/30 hover:shadow-md"
                      }`}
                  >

                    {/* Barre latérale */}

                    <div
                      className={`absolute top-0 left-0 w-1 h-full transition-colors ${isExpanded
                          ? "bg-[#359ADE]"
                          : "bg-[#FFAB02]"
                        }`}
                    />

                    <div className="pl-4 sm:pl-6">

                      {/* EN-TÊTE DU RAPPORT */}

                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        <div className="flex items-center gap-3 min-w-0">

                          <div className="relative shrink-0">

                            <img
                              src={
                                repport.User?.photo
                                  ? `${providers.ImageUrl}/${repport.User.photo}`
                                  : "/images/clientProfile.png"
                              }
                              alt="Photo du collaborateur"
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                            />

                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#FFAB02] border-2 border-white dark:border-gray-800" />

                          </div>

                          <div className="min-w-0">

                            <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                              {userName || "Collaborateur"}
                            </h3>

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(repport.createdAt).toLocaleDateString(
                                "fr-FR",
                                {
                                  weekday: "long",
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                }
                              )}
                            </p>

                            <p className="text-[11px] text-[#359ADE] font-semibold mt-1">
                              Soumis à{" "}
                              {new Date(repport.createdAt).toLocaleTimeString(
                                "fr-FR",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() => toggleReport(index)}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${isExpanded
                              ? "bg-[#359ADE] text-white shadow-md shadow-[#359ADE]/20"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-[#359ADE]/10 hover:text-[#359ADE]"
                            }`}
                        >
                          {isExpanded ? "Réduire" : "Consulter"}

                          <FontAwesomeIcon
                            icon={
                              isExpanded
                                ? faChevronUp
                                : faChevronDown
                            }
                          />

                        </button>

                      </div>

                      {/* SÉPARATEUR */}

                      <div className="h-px bg-gray-100 dark:bg-gray-700/70 mx-4 sm:mx-5" />

                      {/* CONTENU DU RAPPORT */}

                      <div className="p-4 sm:p-5">

                        <div className="flex flex-col gap-2">

                          <div className="flex items-center gap-2">

                            <span className="w-7 h-7 rounded-lg bg-[#FFAB02]/10 flex items-center justify-center text-[#D99000] dark:text-[#FFAB02] text-xs font-bold">
                              01
                            </span>

                            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-extrabold text-gray-400 dark:text-gray-500">
                              Objet du rapport
                            </span>

                          </div>

                          <h4 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white leading-snug">
                            {repport.title || "Rapport sans titre"}
                          </h4>

                        </div>

                        <div className="mt-4 p-4 sm:p-5 rounded-xl bg-[#F7F9FC] dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/70">

                          <p className="text-[10px] uppercase tracking-widest font-bold text-[#359ADE] mb-3">
                            Contenu du rapport
                          </p>

                          <div
                            dangerouslySetInnerHTML={{
                              __html: isExpanded
                                ? repport.content ?? ""
                                : providers.reduceLengthOfText(
                                  repport.content,
                                  255
                                ) ?? "",
                            }}
                            className="text-sm text-gray-600 dark:text-gray-300 leading-7 break-words [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:mb-1 [&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-gray-800 [&_strong]:dark:text-white [&_a]:text-[#359ADE] [&_a]:underline"
                          />

                          {!isExpanded &&
                            repport.content?.length > 255 && (
                              <button
                                type="button"
                                onClick={() => toggleReport(index)}
                                className="mt-2 text-xs font-bold text-[#359ADE] hover:underline"
                              >
                                Lire la suite
                              </button>
                            )}

                        </div>

                        {/* PIÈCES JOINTES */}

                        {repport.files && (

                          <div className="mt-4">

                            <a
                              href={`${providers.ImageUrl}/${repport.files}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-3 p-3 rounded-xl border border-[#359ADE]/20 bg-[#359ADE]/5 hover:bg-[#359ADE]/10 transition-all group/file"
                            >

                              <div className="w-10 h-10 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-[#359ADE] shadow-sm">
                                <FontAwesomeIcon
                                  icon={faPaperclip}
                                  className="text-base"
                                />
                              </div>

                              <div>
                                <p className="text-xs font-bold text-gray-800 dark:text-gray-100">
                                  Pièce jointe disponible
                                </p>

                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                  Cliquer pour consulter le document
                                </p>
                              </div>

                              <FontAwesomeIcon
                                icon={faChevronRight}
                                className="ml-2 text-xs text-[#359ADE] group-hover/file:translate-x-1 transition-transform"
                              />

                            </a>

                          </div>

                        )}

                        {/* =================================================
                            ESPACE ADMINISTRATEUR
                        ================================================== */}

                        {isExpanded && (

                          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-5">

                            {/* COMMENTAIRES EXISTANTS */}

                            {adminReportCommentArray
                              .filter((item: any) =>
                                item.id === repport.UserId
                              )
                              .map((item: any) => (

                                <div
                                  key={item.id}
                                  className="rounded-xl border border-[#FFAB02]/30 bg-[#FFAB02]/5 p-4"
                                >

                                  <div className="flex items-start gap-3">

                                    <div className="w-9 h-9 shrink-0 rounded-xl bg-[#FFAB02]/15 flex items-center justify-center text-[#D99000] dark:text-[#FFAB02]">
                                      <FontAwesomeIcon icon={faCommentDots} />
                                    </div>

                                    <div className="min-w-0 flex-1">

                                      <p className="text-xs font-extrabold uppercase tracking-wider text-[#C58A12] dark:text-[#FFAB02]">
                                        Retour de l'administration
                                      </p>

                                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed break-words">
                                        {item.content}
                                      </p>

                                    </div>

                                  </div>

                                </div>

                              ))}

                            {/* FORMULAIRE DE RÉPONSE */}

                            <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">

                              <div className="flex items-center gap-3 mb-4">

                                <div className="w-10 h-10 rounded-xl bg-[#359ADE]/10 flex items-center justify-center text-[#359ADE]">
                                  <FontAwesomeIcon
                                    icon={faCommentDots}
                                    className="text-lg"
                                  />
                                </div>

                                <div>
                                  <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                    Répondre au collaborateur
                                  </h5>

                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Votre retour sera transmis au collaborateur.
                                  </p>
                                </div>

                              </div>

                              <textarea
                                value={
                                  itemIndexOnWriting === index
                                    ? adminResponse
                                    : ""
                                }
                                onChange={(e) => {
                                  setAdminResponse(e.target.value);
                                  setItemIndexOnWriting(index);
                                }}
                                placeholder="Rédigez une observation, une appréciation ou une demande de complément..."
                                rows={4}
                                className="w-full p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 outline-none resize-y min-h-[110px] focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10 transition-all"
                              />

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">

                                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                  Assurez-vous de vérifier votre réponse avant l'envoi.
                                </p>

                                <button
                                  type="button"
                                  onClick={() => handleSendResponse(repport)}
                                  disabled={
                                    isLoading ||
                                    !(
                                      itemIndexOnWriting === index &&
                                      adminResponse.trim()
                                    )
                                  }
                                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#359ADE] hover:bg-[#2787C1] text-white text-sm font-bold shadow-md shadow-[#359ADE]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                  {isLoading ? (
                                    <>
                                      <ClipLoader
                                        size={16}
                                        color="#fff"
                                      />
                                      Envoi en cours...
                                    </>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon
                                        icon={faCommentDots}
                                      />
                                      Envoyer le retour
                                    </>
                                  )}

                                </button>

                              </div>

                            </div>

                          </div>

                        )}

                      </div>

                    </div>

                  </article>

                );

              })}

            </div>

          ) : (

            /* =====================================================
                AUCUN RAPPORT
            ====================================================== */

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-5 py-14 sm:py-20 text-center">

              <div className="max-w-md mx-auto">

                <div className="relative w-24 h-24 mx-auto mb-6">

                  <div className="absolute inset-0 rounded-3xl bg-[#359ADE]/10 rotate-6" />

                  <div className="relative w-full h-full rounded-3xl bg-[#359ADE]/10 flex items-center justify-center">

                    <img
                      src="/images/folder.png"
                      alt="Aucun rapport"
                      className="w-16 h-16 object-contain opacity-70"
                    />

                  </div>

                </div>

                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                  Aucun rapport disponible
                </h3>

                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Aucun rapport d'activité n'a été trouvé pour cette période.
                  Les nouvelles soumissions de vos collaborateurs apparaîtront
                  automatiquement dans cet espace.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFAB02]/10 text-[#C58A12] dark:text-[#FFAB02] text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#FFAB02]" />
                  {monthsOfYear[monthIndice]} {currentYear}
                </div>

              </div>

            </div>

          )}

        </section>

        {/* =====================================================
            PIED DE PAGE
        ====================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            LRCSheet · Gestion des rapports d'activités
          </p>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Espace de gestion administrative
          </p>

        </div>

      </div>

    </main>
  );
}
