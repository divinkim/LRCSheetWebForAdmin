"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { CitiesResponseDto, CountryResponseDto, DepartmentsPostResponseDto, Enterprise, EnterpriseDto, EnterpriseResponseDto, EnterprisesResponseDto } from "@/types/global";


export default function useAddEnterprise() {
  // Authentification & Session NextAuth
  const { data: session } = useSession();
  const adminRole = (session?.user as any)?.adminRole || null;
  const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId || null;
  const toast = useToast();
  // États des données
  const [inputs, setInputs] = useState<EnterpriseDto>();
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getDepartmentPosts, setDepartmentPosts] = useState<any[]>([]);
  const [getCountry, setCountry] = useState<any[]>([]);
  const [getCity, setCity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const LOCAL_KEY = "inputMemoryOfAddEnterprisePage"

  // Charger la sauvegarde locale au montage
  useEffect(() => {
    const savedInputs = localStorage.getItem(LOCAL_KEY);
    if (savedInputs) {
      try {
        setInputs(JSON.parse(savedInputs));
      } catch (e) {
        console.error("Erreur lors du parsing du localStorage:", e);
      }
    }
  }, []);

  // 2️⃣ Récupération des entreprises et des pays au montage
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [enterprisesData, countriesData] = await Promise.all([
          providers.API.getAll<EnterprisesResponseDto>(providers.APIUrl, "enterprises", null),
          providers.API.getAll<CountryResponseDto>(providers.APIUrl, "countries", null),
        ]);

        setEnterprises(enterprisesData.data || []);
        setCountry(countriesData.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des données initiales:", error);
      }
    };

    fetchInitialData();
  }, []);

  // 3️⃣ Récupération des départements filtrés par EnterpriseId
  useEffect(() => {
    if (!inputs?.EnterpriseId) {
      setDepartmentPosts([]);
      return;
    }

    const fetchDepartmentPosts = async () => {
      try {
        const allDepartments = await providers.API.getAll<DepartmentsPostResponseDto>(providers.APIUrl, "departments", null);
        const filteredDepartments = (allDepartments.data || []).filter(
          (department: { EnterpriseId: number }) => department.EnterpriseId === inputs.EnterpriseId
        );
        setDepartmentPosts(filteredDepartments);
      } catch (error) {
        console.error("Erreur lors de la récupération des départements:", error);
      }
    };

    fetchDepartmentPosts();
  }, [inputs?.EnterpriseId]);

  // 4️⃣ Récupération des villes filtrées par CountryId
  useEffect(() => {
    if (!inputs?.CountryId) {
      setCity([]);
      return;
    }

    const fetchCities = async () => {
      try {
        const allCities = await providers.API.getAll<CitiesResponseDto>(providers.APIUrl, "cities", null);
        const filteredCities = (allCities.data || []).filter(
          (city: any) => city.CountriesTypeId === inputs.CountryId
        );
        setCity(filteredCities);
      } catch (error) {
        console.error("Erreur lors de la récupération des villes:", error);
      }
    };

    fetchCities();
  }, [inputs?.CountryId]);

  // 📊 Options dynamiques pour les champs <select>
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

  //Options statiques
  const staticArrayData = [
    {
      alias: "subscriptionStatus",
      arrayData: [
        { title: "Actif", value: "ACTIVE" },
        { title: "En attente", value: "WAITING" },
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

  const handleSubmit = async () => {
    try {
      if (!inputs) return;
      const requiredFields = {
        'Nom': inputs.name,
        'Description': inputs.description,
        'Logo': inputs.logo,
        "Domaine d'activité": inputs.activityDomain,
        "Statut d'abonnement": inputs.subscriptionStatus,
        "Type d'abonnement": inputs.subscriptionType,
        'Téléphone': inputs.phone,
        'Villes': inputs.CityId,
        'Pays': inputs.CountryId,
        'Latitude': inputs.latitude,
        'Longitude': inputs.longitude,
        'fréquence de paiement': inputs.longitude,
      };

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return toast.error("Champs invalides", `Veuillez renseigner le champs ${key}`)
        }
      }

      setIsLoading(true);

      await providers.API.post<EnterpriseResponseDto>(
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
      );

      localStorage.removeItem(LOCAL_KEY);
      toast.success("Bravo", "Opération effectuée avec succès.")

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
    enterpriseIdOfAdmin,
    LOCAL_KEY
  };
}