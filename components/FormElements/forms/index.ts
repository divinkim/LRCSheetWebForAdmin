import { icon } from "@fortawesome/fontawesome-svg-core";
import {
    faUsers,
    faPlusCircle,
    faBuilding,
    faMoneyBillWave,
    faMapMarkedAlt,
    faMapPin, faFileContract, faSuitcaseRolling, faIdBadge,
    faMoneyCheckAlt,
    faContactCard
} from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { title } from "process";

export const formElements = [
    {
        addOrUpdateUser: {
            navigationLinks: [
                {
                    title: "Liste des collaborateurs",
                    href: "/dashboard/RH/usersList",
                    icon: faUsers
                },
                {
                    title: "Ajouter un poste",
                    href: "/dashboard/ADMIN/addPost",
                    icon: faPlusCircle
                },
                {
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addDepartment",
                    icon: faBuilding
                },
                {
                    title: "Ajouter un salaire",
                    href: "/dashboard/COMPTA/addSalary",
                    icon: faMoneyBillWave
                },
                {
                    title: "Ajouter un arrondissement",
                    href: "/dashboard/OTHERS/addDistrict",
                    icon: faMapMarkedAlt
                },
                {
                    title: "Ajouter un quartier",
                    href: "/dashboard/OTHERS/addQuarter",
                    icon: faMapPin
                }
            ],

            navigateLinks: [
                {
                    title: "Liste des contrats",
                    href: "/dashboard/ADMIN/listContrat",
                    icon: faFileContract
                },
            ],

            addUserTitleForm: "Formulaire d'enregistrement d'un collaborateur",
            updateUserTitleForm: "Formulaire de modification d'un utilisateur",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Statut du collaborateur",
                    placeholder: "Sélectionnez un statut...",
                    requireField: false,
                    type: "text",
                    selectedInput: true,
                    alias: "status"
                },
                {
                    label: "Image de profil du collaborateur",
                    placeholder: "Sélectionnez une image...",
                    requireField: false,
                    type: "file",
                    selectedInput: false,
                    alias: "photo"
                },
                {
                    label: "Rôle du collaborateur",
                    placeholder: "Sélectionnez un rôle",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: false
                    },
                    alias: "role"
                },
                {
                    label: "Service à superviser",
                    placeholder: "Sélectionnez un service...",
                    requireField: false,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: false
                    },
                    alias: "adminService"
                },
                {
                    label: "Noms",
                    placeholder: "Saisissez un nom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "firstname"
                },
                {
                    label: "Prénoms",
                    placeholder: "Saisissez un prénom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "lastname"
                },
                {
                    label: "Date de naissance",
                    placeholder: "Sélectionnez une date...",
                    requireField: true,
                    type: "date",
                    selectedInput: false,
                    alias: "birthDate"
                },
                {
                    label: "Genre",
                    placeholder: "Sélectionnez un genre...",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: false,
                    },
                    alias: "gender"
                },
                {
                    label: "Email",
                    placeholder: "Saisissez un email...",
                    requireField: true,
                    type: "email",
                    selectedInput: false,
                    alias: "email"
                },
                {
                    label: "Mot de passe",
                    placeholder: "Saisissez un mot de passe...",
                    requireField: true,
                    type: "password",
                    selectedInput: false,
                    alias: "password"
                },
                {
                    label: "Téléphone",
                    placeholder: "Saisissez un numéro...",
                    requireField: true,
                    type: "tel",
                    selectedInput: false,
                    alias: "phone"
                },
                {
                    label: "Etat civil",
                    placeholder: "Choisissez un état",
                    requireField: false,
                    type: "text",
                    selectedInput: true,
                    alias: "maritalStatus"
                },

                // ---- Select Inputs ----
                {
                    label: "Entreprise",
                    placeholder: "Sélectionnez une entreprise...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "EnterpriseId"
                },
                {
                    label: "Département",
                    placeholder: "Sélectionnez un département...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "DepartmentPostId"
                },
                {
                    label: "Poste",
                    placeholder: "Sélectionnez un poste...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "PostId"
                },
                {
                    label: "Planning",
                    placeholder: "Sélectionnez un planning...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "PlanningId"
                },
                {
                    label: "Type de contrat",
                    placeholder: "Sélectionnez un type de contrat...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true,
                    },
                    alias: "ContractTypeId"
                },
                {
                    label: "Salaire",
                    placeholder: "Sélectionnez un salaire...",
                    requireField: false,
                    type: "number",
                    selectedInput: true,
                    alias: "SalaryId",
                    dynamicOptions: {
                        status: true
                    },
                },
                {
                    label: "Pays",
                    placeholder: "Sélectionnez un pays...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    alias: "CountryId",
                    dynamicOptions: {
                        status: true
                    },
                },
                {
                    label: "Ville",
                    placeholder: "Sélectionnez une ville...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    alias: "CityId",
                    dynamicOptions: {
                        status: true
                    },
                },
                {
                    label: "Arrondissement",
                    placeholder: "Sélectionnez un arrondissement...",
                    requireField: false,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "DistrictId"
                },
                {
                    label: "Quartier",
                    placeholder: "Sélectionnez un quartier...",
                    requireField: false,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "QuarterId"
                },
            ],


        },

        addOrUpdateEnterprise: {
            navigationLinks: [
                {
                    title: "Liste des entreprises",
                    href: "/dashboard/OTHERS/enterprisesList",
                    icon: faUsers
                },
                {
                    title: "Ajouter un ville",
                    href: "/dashboard/ADMIN/addCity",
                    icon: faPlusCircle
                },
                {
                    title: "Ajouter un pays",
                    href: "/dashboard/ADMIN/addCountry",
                    icon: faBuilding
                },
            ],

            navigateLinks: [
                {
                    title: "Liste des contrats",
                    href: "/dashboard/ADMIN/listContrat",
                    icon: faFileContract
                },
            ],

            addEnterpriseTitleForm: "Formulaire d'enregistrement d'une entreprise",
            updateEnterpriseTitleForm: "Formulaire de modification d'une entreprise",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Nom de l'entreprise",
                    placeholder: "Saisissez le nom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "name"
                },
                {
                    label: "Description de l'entreprise",
                    placeholder: "Saisissez une description",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "description"
                },
                {
                    label: "Domaine d'activité",
                    placeholder: "Saisissez un domaine...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "activityDomain"
                },
                {
                    label: "Téléphone",
                    placeholder: "Saisissez un numéro de téléphone",
                    requireField: true,
                    type: "tel",
                    selectedInput: false,
                    alias: "phone"
                },
                {
                    label: "email",
                    placeholder: "Saisissez un email...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "email"
                },
                {
                    label: "Adresse",
                    placeholder: "Saisissez une adresse...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "address"
                },
                {
                    label: "Site web",
                    placeholder: "Saisissez un lien...",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "website"
                },
                {
                    label: "Latitude",
                    placeholder: "Entrez la latitude...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "latitude"
                },
                {
                    label: "Longitude",
                    placeholder: "Entrez la longitude...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "longitude"
                },
                {
                    label: "Forme légale",
                    placeholder: "Sélectionnez une forme légale",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    alias: "legalForm",
                    dynamicOptions: {
                        status: false
                    }
                },
                {
                    label: "RCCM",
                    placeholder: "Entrez le RCCM...",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "rccm",
                    dynamicOptions: {
                        status: false
                    }
                },
                {
                    label: "NIU",
                    placeholder: "Entrez le NIU...",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "nui",
                    dynamicOptions: {
                        status: false
                    }
                },
                {
                    label: "Type d'abonnement",
                    placeholder: "Sélectionner le type d'abonnement",
                    requireField: false,
                    type: "text",
                    selectedInput: true,
                    alias: "subscriptionType",
                    dynamicOptions: {
                        status: false
                    }
                },
                {
                    label: "Status d'abonnement",
                    placeholder: "Sélectionner le status...",
                    requireField: false,
                    type: "text",
                    selectedInput: true,
                    alias: "subscriptionStatus",
                    dynamicOptions: {
                        status: false
                    }
                },
                {
                    label: "Temps sur retard toléré",
                    placeholder: "Entrez une valeur ex:15",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "toleranceTime",
                },
                {
                    label: "Temps sur retard maximal toléré",
                    placeholder: "Entrez une valeur ex:15",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "maxToleranceTime",
                },
                {
                    label: "Pourcentage de déduction sur retard",
                    placeholder: "Entrez une valeur ex:15",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "pourcentageOfHourlyDeduction",
                },
                {
                    label: "Pourcentage de déduction maximal sur retard",
                    placeholder: "Entrez une valeur ex:15",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "maxPourcentageOfHourlyDeduction",
                },
                {
                    label: "Pays",
                    placeholder: "Sélectionnez un pays...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    alias: "CountryId",
                    dynamicOptions: {
                        status: true
                    },
                },

                {
                    label: "Ville",
                    placeholder: "Sélectionnez une ville...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    alias: "CityId",
                    dynamicOptions: {
                        status: true
                    },
                },
                {
                    label: "Logo de l'entreprise",
                    placeholder: "Sélectionnez un logo.",
                    requireField: true,
                    type: "file",
                    selectedInput: false,
                    alias: "logo"
                },
            ],
        },

        //Formulaire du type de contrat

        addTypeContratUser: {
            navigationsLinks: [
                {
                    title: "Ajouter un type de contrat",
                    href: "/dashboard/ADMIN/addTypeContrat"

                },

                {
                    title: "Liste des types de contrats",
                    href: "/dashboard/ADMIN/listTypeContrat",
                    icon: faFileContract
                }
            ],

            titleTypeContract: "Formulaire de création d'un type de contract",


            inputTypeConract: [
                {
                    label: "Nom du titre",
                    placeholder: "Saisissez un titre",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "title"
                },

                {
                    label: "Description",
                    placeholder: "Saisissez la description",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "description"
                },

                {
                    lable: "Entreprise",
                    placeholder: "Sélectionnez une entreprise",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: false
                    },
                    alias: "EnterpriseId"
                }

            ],


        },

        //Formulaire du contrat
        addContractUser: {
            navigationsLinks: [

                {
                    title: "Ajouter un contrat",
                    href: "/dashboard/ADMIN/addContrat"

                },

                {
                    title: "Liste des contrats",
                    href: "/dashboard/ADMIN/contractsList",
                    icon: faFileContract
                }

            ],

            tilteContract: "Formulaire de création de contrat",
            titleFormContract: "Ajouter un contrat",

            inputContrat: [
                {
                    label: "Nom contrat",
                    placeholder: "Saisissez le nom du contrat ",
                    requireField: false,
                    type: "text",
                    selectedInput: false,
                    alias: "ContractType"

                },
                {
                    label: "Type de contrat",
                    placeholder: "Sélectionnez un type de contrat...",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "ContractTypeId"

                },
                {
                    label: "Date de début",
                    placeholder: "Sélectionnez la date de début",
                    requireField: true,
                    type: "date",
                    selectedInput: false,
                    alias: "startDate"

                },
                {
                    label: "Date de fin",
                    placeholder: "Sélectionnez la date de fin",
                    requireField: true,
                    type: "date",
                    selectedInput: false,
                    alias: "endDate"

                },
                {
                    label: "Durée",
                    placeholder: "Sélectionnez la durée",
                    requireField: true,
                    type: "text",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "delay"

                },

                {
                    label: "Entreprise",
                    placeholder: "Sélectionnez une entreprise",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "EnterpriseId"

                },

            ],
        },

        //Formulaire département
        addDepartmentUser: {

            navigationDeptLinks: [
                {
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addDepartment",
                    icon: faBuilding
                },
                {
                    title: "Liste de départements",
                    href: "/dashboard/ADMIN/departmentsList",
                    icon: faBuilding
                },

                {
                    title: "Modifier un départements",
                    href: "/dashboard/ADMIN/UpdateDept",
                    icon: faBuilding
                },
            ],

            titleDept: "Formulaire d'enregistrement d'un département",
            titleUpdate: "Formulaire de modification d'un département",
            titleformDept: "Ajouter un département",

            inputDept: [
                {
                    label: "Nom",
                    placeholder: "Saisissez un nom",
                    requireField: true,
                    type: "text",
                    textarea: false,
                    selectedInput: false,
                    alias: "name"

                },
                {
                    label: "Entreprise",
                    placeholder: "Séléctionnez une entreprise",
                    requireField: true,
                    type: "number",
                    textarea: true,
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "EnterpriseId"

                },
                {
                    label: "Description",
                    placeholder: "Saisissez une description",
                    requireField: false,
                    type: "text",
                    textarea: true,
                    selectedInput: false,
                    alias: "description"

                },

            ],



        },

        addOrUpdateSalary: {
            navigationLinks: [
                {
                    title: "Liste des salaires",
                    href: "/dashboard/COMPTA/salariesList",
                    icon: faMoneyCheckAlt
                },
                {
                    title: "Ajouter un poste",
                    href: "/dashboard/ADMIN/addPost",
                    icon: faContactCard
                },
            ],

            addSalaryTitleForm: "Ajouter un salaire",
            updateUserTitleForm: "Formulaire de modification d'un salaire",

            titleForm: "Formulaire d'ajout d'un salaire",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Salaire brute",
                    placeholder: "Entrez un montant ex:100000...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "grossSalary"
                },
                {
                    label: "Salaire journalier",
                    placeholder: "Entrez un montant ex:100000...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    alias: "dailySalary"
                },
                // ---- Select Inputs ----
                {
                    label: "Entreprise",
                    placeholder: "Sélectionnez une entreprise...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "EnterpriseId"
                },
                {
                    label: "Poste",
                    placeholder: "Sélectionnez un poste...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "PostId"
                },
            ],
        },

        addOrEditPost: {
            navigationLinks: [
                {
                    title: "Liste des Postes",
                    href: "/dashboard/ADMIN/potesList",
                    icon: faIdBadge
                },
                {
                    title: "Ajouter une entreprise",
                    href: "/dashboard/OTHERS/addEnterprise",
                    icon: faBuilding
                },
                {
                    title: "Ajouter un département",
                    href: "/dashboard/ADMIN/addDepartment",
                    icon: faSuitcaseRolling
                }
            ],

            addPostTitlePage: "Ajouter un un poste",
            updatePostTitlePage: "Modifier un poste",

            titleForm: "Formulaire d'ajout d'un poste",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Titre",
                    placeholder: "Entrez un titre...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    textarea: false,
                    alias: "title"
                },

                // ---- Select Inputs ----
                {

                    label: "Entreprise",
                    placeholder: "Sélectionnez une entreprise...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    textarea: false,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "EnterpriseId"
                },
                {
                    index: 1,
                    label: "Département d'entreprise",
                    placeholder: "Sélectionnez un département",
                    requireField: true,
                    type: "number",
                    textarea: false,
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "DepartmentPostId"
                },
                {
                    label: "Description",
                    placeholder: "Veuillez saisir une description",
                    requireField: true,
                    textarea: true,
                    type: "text",
                    selectedInput: false,
                    alias: "description"
                },
            ],
        },

        addQuarter: {

            titleForm: "Formulaire d'enregistrement d'un quartier",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Nom",
                    placeholder: "Entrez un nom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    textarea: false,
                    alias: "name"
                },

                // ---- Select Inputs ----
                {

                    label: "pays",
                    placeholder: "Sélectionnez un pays...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    textarea: false,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "CountryId"
                },
                {
                    label: "Villes",
                    placeholder: "Sélectionnez une ville",
                    requireField: true,
                    type: "number",
                    textarea: false,
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "CityId"
                },
                {
                    label: "Arrondissements",
                    placeholder: "Sélectionnez un arrondissement",
                    requireField: true,
                    type: "number",
                    textarea: false,
                    selectedInput: true,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "DistrictId"
                },

            ],
        },

        addDistrict: {
            titleForm: "Formulaire d'enregistrement d'un arrondissement",
            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Nom de l'arrondissement",
                    placeholder: "Entrez un nom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    textarea: false,
                    alias: "name"
                },

                // ---- Select Inputs ----
                {

                    label: "pays",
                    placeholder: "Sélectionnez un pays...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    textarea: false,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "CountryId"
                },
                {

                    label: "Villes",
                    placeholder: "Sélectionnez une ville...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    textarea: false,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "CityId"
                },
            ],
        },

        addCity: {

            titleForm: "Formulaire d'enregistrement d'une ville",

            inputs: [
                // ---- Inputs classiques ----
                {
                    label: "Nom de la ville",
                    placeholder: "Entrez un nom...",
                    requireField: true,
                    type: "text",
                    selectedInput: false,
                    textarea: false,
                    alias: "name"
                },

                // ---- Select Inputs ----
                {

                    label: "pays",
                    placeholder: "Sélectionnez un pays...",
                    requireField: true,
                    type: "number",
                    selectedInput: true,
                    textarea: false,
                    dynamicOptions: {
                        status: true
                    },
                    alias: "CountriesTypeId"
                },
            ],
        }
    }
];
