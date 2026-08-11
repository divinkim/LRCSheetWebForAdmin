"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";
export type InputsValue = {
  name: string;
  description: string;
  logo: string;
  activityDomain: string;
  phone: string;
  toleranceTime: string | null;
  maxToleranceTime: string | null;
  pourcentageOfHourlyDeduction: string | null;
  maxPourcentageOfHourlyDeduction: string | null;
  email: string;
  address: string;
  website: string | null;
  latitude: string;
  longitude: string;
  CityId: number | null;
  City: { name: string };
  CountryId: number | null;
  Country: { name: string };
  legalForm: string;
  rccm: string | null;
  nui: string | null;
  subscriptionType: string;
  subscriptionStatus: string;
  EnterpriseId?: number | null;
  [key: string]: any;
};

const INITIAL_INPUTS: InputsValue = {
  name: "",
  description: "",
  logo: "",
  activityDomain: "",
  phone: "",
  toleranceTime: null,
  maxToleranceTime: null,
  pourcentageOfHourlyDeduction: null,
  maxPourcentageOfHourlyDeduction: null,
  email: "",
  address: "",
  website: null,
  latitude: "",
  longitude: "",
  CityId: null,
  City: { name: "" },
  CountryId: null,
  Country: { name: "" },
  legalForm: "",
  rccm: null,
  nui: null,
  subscriptionType: "",
  subscriptionStatus: "",
};

export default function useAddEnterprise() {
  // Authentification & Session NextAuth
  const { data: session } = useSession();
  const adminRole = (session?.user as any)?.adminRole || null;
  const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId || null;
  const toast = useToast();
  // États des données
  const [inputs, setInputs] = useState<InputsValue>(INITIAL_INPUTS);
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getDepartmentPosts, setDepartmentPosts] = useState<any[]>([]);
  const [getCountry, setCountry] = useState<any[]>([]);
  const [getCity, setCity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Charger la sauvegarde locale au montage
  useEffect(() => {
    const savedInputs = localStorage.getItem("inputMemoryOfAddEnterprisePage");
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
          providers.API.getAll(providers.APIUrl, "getEnterprises", null),
          providers.API.getAll(providers.APIUrl, "getCountries", null),
        ]);

        setEnterprises(enterprisesData || []);
        setCountry(countriesData || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des données initiales:", error);
      }
    };

    fetchInitialData();
  }, []);

  // 3️⃣ Récupération des départements filtrés par EnterpriseId
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setDepartmentPosts([]);
      return;
    }

    const fetchDepartmentPosts = async () => {
      try {
        const allDepartments = await providers.API.getAll(providers.APIUrl, "getDepartmentPosts", null);
        const filteredDepartments = (allDepartments || []).filter(
          (department: { EnterpriseId: number }) => department.EnterpriseId === inputs.EnterpriseId
        );
        setDepartmentPosts(filteredDepartments);
      } catch (error) {
        console.error("Erreur lors de la récupération des départements:", error);
      }
    };

    fetchDepartmentPosts();
  }, [inputs.EnterpriseId]);

  // 4️⃣ Récupération des villes filtrées par CountryId
  useEffect(() => {
    if (!inputs.CountryId) {
      setCity([]);
      return;
    }

    const fetchCities = async () => {
      try {
        const allCities = await providers.API.getAll(providers.APIUrl, "getCities", null);
        const filteredCities = (allCities || []).filter(
          (city: any) => city.CountriesTypeId === inputs.CountryId
        );
        setCity(filteredCities);
      } catch (error) {
        console.error("Erreur lors de la récupération des villes:", error);
      }
    };

    fetchCities();
  }, [inputs.CountryId]);

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

  // 📋 Options statiques
  const staticArrayData = [
    {
      alias: "subscriptionStatus",
      arrayData: [
        { title: "En cours", value: "onGoing" },
        { title: "Expiré", value: "expired" },
      ],
    },
    {
      alias: "subscriptionType",
      arrayData: [
        { title: "Premium", value: "premium" },
        { title: "Pro", value: "pro" },
        { title: "Standard", value: "standard" },
      ],
    },
  ];

  // 🚀 Soumission du formulaire
  const handleSubmit = async () => {
    const requiredFields = {
      name: inputs.name,
      description: inputs.description,
      logo: inputs.logo,
      activityDomain: inputs.activityDomain,
      phone: inputs.phone,
      CityId: inputs.CityId,
      CountryId: inputs.CountryId,
      latitude: inputs.latitude,
      longitude: inputs.longitude,
    };

    // Validation des champs obligatoires
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        toast.error("Champs invalides",
          "Veuillez renseigner tous les champs obligatoires."
        )
        return
      }
    }

    setIsLoading(true);

    try {
      const response = await providers.API.post(
        providers.APIUrl,
        "createEnterprise",
        null,
        inputs
      );

      if (response.status) {
        localStorage.removeItem("inputMemoryOfAddEnterprisePage");
        toast.success(
          "Bravo",
          "Entreprise enregistrée avec succès."
        )
      }

    } catch (error) {
      console.log(error);
      toast.error('Erreur',
        error instanceof Error ? error.message : "Erreur survenue."
      )
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
  };
}