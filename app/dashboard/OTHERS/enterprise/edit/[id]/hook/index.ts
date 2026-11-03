"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { CitiesResponseDto, CountryResponseDto, DepartmentsPostResponseDto, Enterprise, EnterprisesResponseDto } from "@/types/global";

export default function useUpdateEnterprise() {
  const { data: session } = useSession();

  // États de données
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getDepartmentPosts, setDepartmentPosts] = useState<any[]>([]);
  const [getCountry, setCountry] = useState<any[]>([]);
  const [getCity, setCity] = useState<any[]>([]);

  // États utilisateur / administration
  const [enterpriseId, setEnterpriseId] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const toast = useToast();
  const LOCAL_KEY = "inputMemoryOfEditEnterprisePage"

  // État des inputs
  const [inputs, setInputs] = useState<Enterprise>();

  // 1. Initialisation de la session et chargement des données de l'entreprise
  useEffect(() => {
    (async () => {
      const user = session?.user;
      const enterpriseIdFromUrl = window.location.href.split("/").pop();
      const currentEnterpriseId = (user as any)?.EnterpriseId || null
      const adminRole = (user as any)?.adminRole || null;
      // Récupération de la mémoire locale si elle existe
      const getInputMemory = localStorage.getItem(LOCAL_KEY);
      if (getInputMemory) {
        setInputs(JSON.parse(getInputMemory));
      }

      //Chargement depuis l'API si pas de mémoire locale
      if (currentEnterpriseId) {
        const enterprisesList = await providers.API.getAll<EnterprisesResponseDto>(providers.APIUrl, "enterprises", null);
        setEnterprises(enterprisesList.data);

        const currentEnterprise = enterprisesList.data.find(
          (item: { id: number }) => item.id === Number(enterpriseIdFromUrl)
        );

        if (currentEnterprise) {
          const subscriptionExpiresAt = currentEnterprise.subscriptionExpiresAt;
          setInputs({
            ...currentEnterprise,
            subscriptionExpiresAt: subscriptionExpiresAt
              ? (new Date(subscriptionExpiresAt).toISOString().split('T')[0] as unknown as Date)
              : null
          });
        }
        setEnterpriseId(String(currentEnterpriseId));
        setAdminRole(adminRole);
      }
    })();
  }, [session]);

  // 2. Chargement des pays
  useEffect(() => {
    (async () => {
      const countriesList = await providers.API.getAll<CountryResponseDto>(providers.APIUrl, "countries", null);
      setCountry(countriesList.data);
    })();
  }, []);

  // 3. Chargement des départements filtrés par entreprise
  useEffect(() => {
    if (!inputs?.EnterpriseId && !enterpriseId) return;
    (async () => {
      const targetEnterpriseId = inputs?.EnterpriseId || Number(enterpriseId);
      const departmentPostsList = await providers.API.getAll<DepartmentsPostResponseDto>(providers.APIUrl, "departments", null);
      const filteredDepartments = departmentPostsList.data.filter(
        (department: { EnterpriseId: number }) => department.EnterpriseId === targetEnterpriseId
      );
      setDepartmentPosts(filteredDepartments);
    })();
  }, [inputs?.EnterpriseId, enterpriseId]);

  // 4. Chargement des villes filtrées par pays
  useEffect(() => {
    if (!inputs?.CountryId) return;
    (async () => {
      const citiesList = await providers.API.getAll<CitiesResponseDto>(providers.APIUrl, "cities", null);
      const filteredCities = citiesList.data.filter(
        (city: any) => city.CountriesTypeId === inputs.CountryId || city.CountryId === inputs.CountryId
      );
      setCity(filteredCities);
    })();
  }, [inputs?.CountryId]);

  // Structure des options dynamiques
  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
      arrayData: getEnterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "MainEnterpriseId",
      arrayData: getEnterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "DepartmentPostId",
      arrayData: getDepartmentPosts
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "CountryId",
      arrayData: getCountry
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "CityId",
      arrayData: getCity
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
  ];

  // Structure des options statiques
  const staticArrayData = [
    {
      alias: "subscriptionStatus",
      arrayData: [
        { title: "Actif", value: "ACTIVE" },
        { title: "En attente", value: "PENDING" },
        { title: "Expiré", value: "INACTIVE" },
      ],
    },
    {
      alias: "legalForm",
      arrayData: [
        { title: "SARL", value: "SARL" },
        { title: "SARLU", value: "SARLU" },
        { title: "SA", value: "SA" },
        { title: "ETS", value: "ETS" },
      ],
    },
    {
      alias: "subscriptionType",
      arrayData: [
        { title: "Starter", value: "STARTER" },
        { title: "PREMIUM", value: "PREMIUM" },
        { title: "PRO", value: "PRO" },
      ],
    },
    {
      alias: "paymentFrequency",
      arrayData: [
        { title: "Mensuel", value: "MONTHLY" },
        { title: "Trimestriel", value: "QUARTERLY" },
        { title: "Semestriel", value: "SEMI_ANNUAL" },
        { title: "Annuel", value: "ANNUAL" },

      ],
    },
  ];

  // Soumission des modifications
  const handleSubmit = async () => {
    try {
      if (!inputs) return;
      const requiredFields = {
        'Nom': inputs.name,
        'Description': inputs.description,
        'Logo': inputs.logo,
        "Statut d'abonnement": inputs.subscriptionStatus,
        "Type d'abonnement": inputs.subscriptionType,
        "Domaine d'activité": inputs.activityDomain,
        'Téléphone': inputs.phone,
        'Villes': inputs.CityId,
        'Pays': inputs.CountryId,
        'Latitude': inputs.latitude,
        'Longitude': inputs.longitude,
      };

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return toast.error("Champs invalides", `Veuillez renseigner le champs ${key}`)
        }
      }

      setIsLoading(true);

      await providers.API.update(
        providers.APIUrl,
        "enterprises",
        null,
        {
          name: inputs.name,
          description: inputs.description,
          logo: inputs.logo,
          activityDomain: inputs.activityDomain,
          phone: inputs.phone,
          email: inputs.email,
          address: inputs.address,
          website: inputs.website,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
          legalForm: inputs.legalForm,
          rccm: inputs.rccm,
          nui: inputs.nui,
          subscriptionType: inputs.subscriptionType,
          subscriptionStatus: inputs.subscriptionStatus,
          toleranceTime: inputs.toleranceTime,
          pourcentageOfHourlyDeduction: inputs.pourcentageOfHourlyDeduction,
          maxToleranceTime: inputs.maxToleranceTime,
          maxPourcentageOfHourlyDeduction: inputs.maxPourcentageOfHourlyDeduction,
          paymentFrequency: inputs.paymentFrequency,
          paymentMode: inputs.paymentMode,
          paymentCurrency: inputs.paymentCurrency,
          paymentMethod: inputs.paymentMethod,
          subscriptionAmount: inputs.subscriptionAmount,
          subscribeCurrency: inputs.subscribeCurrency,
          subscriptionExpiresAt: inputs.subscriptionExpiresAt
            ? new Date(inputs.subscriptionExpiresAt).toISOString()
            : null,
        },
        Number(enterpriseId)
      );

      localStorage.removeItem(LOCAL_KEY);
      toast.success("Bravo", "Mise à jour effectuée avec succès.")

    } catch (error) {
      toast.error("Erreur", error instanceof Error ? error.message : "Erreur réseau")
    } finally {
      setIsLoading(false);
    }

  };

  return {
    dynamicArrayData,
    staticArrayData,
    handleSubmit,
    inputs,
    setInputs,
    isLoading,
    adminRole,
    LOCAL_KEY
  };
}