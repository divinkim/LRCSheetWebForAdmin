import { faCalendarPlus, faCity, faFlag, faGlobe, faHouse, faMap, faMapLocationDot, faPen, faPlus, faUserPlus } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { title } from "process"
export const tablesModal = [
    {
        usersList: {
            pageTitle: "Liste des collaborateurs enregistrées",
            path: "Dashboard/RH/Liste des utilisateurs",
            links: [
                {
                    title: "Ajouter un collaborateur",
                    href: "../RH/addUser",
                    icon: faUserPlus
                },
            ],
            table: {
                titles: [
                    { title: "Profils", alias: "" },
                    { title: "Noms & prénoms", alias: "" },
                    { title: "Téléphones", alias: "" },
                    { title: "Emails", alias: "" },
                    { title: "Genres", alias: "" },
                    { title: "Entreprises", alias: "" },
                    { title: "Status", alias: "" },
                    { title: "Actions", alias: "" },
                ]
            }
        },
        presencesList: {
            pageTitle: "Liste de présence enregistrée",
            path: "Dashboard/RH/Liste de présence",
            links: [
                {
                    title: "Ajouter une présence",
                    href: "",
                    icon: faCalendarPlus,
                    modal: "addPresenceModal"
                },
                {
                    title: "Modifier une présence",
                    href: "",
                    icon: faPen,
                    modal: "updatePresenceModal"
                },
            ],
            table: {
                titles: [
                    { title: "Profils", alias: "" },
                    { title: "Noms & prénoms", alias: "" },
                    { title: "Arrivées & pauses", alias: "" },
                    { title: "Reprises & départs", alias: "" },
                    //  { title: "Horaires", alias: "" },
                    { title: "Jours et date", alias: "" },
                    { title: "Entreprises", alias: "" },
                    { title: "Statuts", alias: "" },
                    { title: "Actions", alias: "" },
                ]
            }
        },
        enterprisesList: {
            pageTitle: "Liste des entreprises enregistrées",
            path: "Dashboard/RH/Liste des entreprises",
            links: [
                {
                    title: "Ajouter une entreprise",
                    href: "/pages/dashboard/OTHERS/addEnterprise",
                    icon: faCalendarPlus
                },
            ],
            table: {
                titles: [
                    { title: "Logos", alias: "" },
                    { title: "Descriptions", alias: "" },
                    { title: "Domaine d'activité", alias: "" },
                    { title: "Téléphones", alias: "" },
                    //  { title: "Horaires", alias: "" },
                    { title: "emails", alias: "" },
                    // { title: "Adresses", alias: "" },
                    { title: "Abonnements", alias: "" },
                    { title: "Statuts", alias: "" },
                    { title: "Actions", alias: "" }
                ]
            }
        },
        weekDaysPlanningList: {
            pageTitle: "Liste des collaborateus associés au planning",
            path: "Dashboard/RH/Liste des collaborateus associés au planning",
            links: [
                {
                    title: "Ajouter un collaborateur au planning de la semaine",
                    href: "/dashboard/RH/addUserInPlanningOfWeek",
                    icon: faCalendarPlus
                },
                {
                    title: "Modifier le planning de la semaine d'un collaborateur",
                    href: "/dashboard/RH/updateUserInPlanningOfWeek",
                    icon: faCalendarPlus
                },
            ],
            table: {
                titles: [
                    { title: "Profils", alias: "" },
                    { title: "Noms & prénoms", alias: "" },
                    { title: "Jours", alias: "" },
                    { title: "Types de planning" },
                    { title: "Plannings horaires", alias: "" },
                    { title: "Entreprises" },
                    { title: "Actions", alias: "" },
                ]
            }
        },
        postsList: {
            pageTitle: "Liste des postes enregistrés",
            path: "Dashboard/ADMININISTRATION/Liste des poqtes",
            links: [
                {
                    title: "Ajouter un poste",
                    href: "/dashboard/ADMIN/addPost",
                    icon: faCalendarPlus
                },
            ],
            table: {
                titles: [
                    { title: "Titres", alias: "" },
                    { title: "description", alias: "" },
                    { title: "Entreprises", alias: "" },
                    { title: "Départements" },
                    { title: "Actions", alias: "" },
                ]
            }
        },

        departementList: {
            pageTitle: "Listes des départments  enregistrés",
            path: "Dashboard/ADMININISTRATION/Liste des départements",
            links: [
                {
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addDepartment",
                    icon: faCalendarPlus

                }
            ],

            table: {
                titles: [
                    { title: "Noms", alias: "" },
                    { title: "Description", alias: "" },
                    { title: "Entreprises", alias: "" },
                    { title: "Actions", alias: "" }
                ]
            }

        },

        contractList: {
            pageTitle: "Listes des contrats enregistrés",
            path: "Dashboard/ADMININISTRATION/Liste des contrats",
            links: [
                {
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addContract",
                    icon: faCalendarPlus

                }
            ],

            tables: {
                titles: [
                    { title: "Date de début", alias: "" },
                    { title: "Date de fin", alias: "" },
                    { title: "Délai", alias: "" },
                    { title: "Typde de contrat", alias: "", },
                    { title: "Entreprise", alias: "" },
                    { title: "Action", alias: "" }
                ]
            }

        },


        salariesList: {
            pageTitle: "Liste des salaires enregistrés",
            path: "Dashboard/ADMININISTRATION/Liste des salaires",
            links: [
                {
                    title: "Ajouter un salaire",
                    href: "/dashboard/COMPTA/addSalary",
                    icon: faCalendarPlus
                },
            ],
            table: {
                titles: [
                    { title: "Salaire de base", alias: "" },
                    { title: "Salaire journaliers", alias: "" },
                    { title: "Entreprises", alias: "" },
                    { title: "Postes" },
                    { title: "Actions", alias: "" },
                ]
            }
        },

        quartersList: {
            pageTitle: "Liste des quartiers enregistrés",
            path: "Dashboard/Localités/Quartiers enregistrés",
            links: [
                {
                    title: "Ajouter un pays",
                    href: "/dashboard/LOCALITIES/addCountry",
                    icon: faGlobe
                },
                {
                    title: "Ajouter un arrondissement",
                    href: "/dashboard/LOCALITIES/addDistrict",
                    icon: faCity
                },
                {
                    title: "Ajouter un quartier",
                    href: "/dashboard/LOCALITIES/addQuarter",
                    icon: faHouse
                }
            ],
            table: {
                titles: [
                    { title: "Noms", alias: "" },
                    { title: "Pays", alias: "" },
                    { title: "Villes", alias: "" },
                    { title: "Arrondissements" },
                    { title: "Actions", alias: "" },
                ]
            }
        },

        districtsList: {
            pageTitle: "Liste des arrondissements enregistrés",
            path: "Dashboard/Localités/Arrondissements enregistrés",
            links: [
                {
                    title: "Ajouter une ville",
                    href: "/dashboard/LOCALITY/addCity",
                    icon: faCity
                },
                {
                    title: "Ajouter un arrondissement",
                    href: "/dashboard/LOCALITY/addDistrict",
                    icon: faMapLocationDot
                },
            ],
            table: {
                titles: [
                    { title: "Noms", alias: "" },
                    { title: "Pays", alias: "" },
                    { title: "Villes", alias: "" },
                    { title: "Actions", alias: "" },
                ]
            }
        },
        citiesList: {
            pageTitle: "Liste des villes enregistrées",
            path: "Dashboard/Localités/Villes enregistrées",
            links: [
                {
                    title: "Ajouter une ville",
                    href: "/dashboard/LOCALITY/addCountry",
                    icon: faGlobe
                },
            ],
            table: {
                titles: [
                    { title: "Noms", alias: "" },
                    { title: "Pays", alias: "" },
                    { title: "Actions", alias: "" },
                ]
            }
        }
    }
]