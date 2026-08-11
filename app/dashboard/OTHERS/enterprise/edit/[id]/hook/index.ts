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
  MainEnterpriseId: number | null,
  City: {
    name: string;
  };
  CountryId: number | null;
  Country: {
    name: string;
  };
  legalForm: string;
  rccm: string | null;
  nui: string | null;
  subscriptionType: string;
  subscriptionStatus: string;
  [key: string]: any;
};

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
  // État des inputs
  const [inputs, setInputs] = useState<InputsValue>({
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
    MainEnterpriseId: null,
    City: { name: "" },
    CountryId: null,
    Country: { name: "" },
    legalForm: "",
    rccm: null,
    nui: null,
    subscriptionType: "",
    subscriptionStatus: "",
  });

  // 1. Initialisation de la session et chargement des données de l'entreprise
  useEffect(() => {
    (async () => {
      const user = session?.user
      // Récupération de l'ID d'entreprise (URL ou fallback session)
      const enterpriseIdFromUrl = window.location.href.split("/").pop();
      const currentEnterpriseId = (user as any)?.EnterpriseId || null
      const adminRole = (user as any)?.adminRole || null;

      if (currentEnterpriseId) setEnterpriseId(String(currentEnterpriseId));
      if (adminRole) setAdminRole(adminRole);

      // Récupération de la mémoire locale si elle existe
      const getInputMemory = localStorage.getItem("inputMemoryOfAddEnterprisePage");
      if (getInputMemory) {
        setInputs(JSON.parse(getInputMemory));
        return;
      }

      //Chargement depuis l'API si pas de mémoire locale
      if (currentEnterpriseId) {
        const enterprisesList = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
        setEnterprises(enterprisesList);

        const currentEnterprise = enterprisesList.find(
          (item: { id: number }) => item.id === Number(enterpriseIdFromUrl)
        );

        if (currentEnterprise) {
          setInputs({
            name: currentEnterprise.name || "",
            description: currentEnterprise.description || "",
            logo: currentEnterprise.logo || "",
            activityDomain: currentEnterprise.activityDomain || "",
            phone: currentEnterprise.phone || "",
            toleranceTime: currentEnterprise.toleranceTime,
            maxToleranceTime: currentEnterprise.maxToleranceTime,
            pourcentageOfHourlyDeduction: currentEnterprise.pourcentageOfHourlyDeduction,
            maxPourcentageOfHourlyDeduction: currentEnterprise.maxPourcentageOfHourlyDeduction,
            email: currentEnterprise.email || "",
            address: currentEnterprise.address || "",
            website: currentEnterprise.website,
            latitude: currentEnterprise.latitude || "",
            longitude: currentEnterprise.longitude || "",
            CityId: currentEnterprise.CityId,
            MainEnterpriseId: currentEnterprise.MainEnterpriseId,
            City: {
              name: currentEnterprise.City?.name || "",
            },
            CountryId: currentEnterprise.CountryId || currentEnterprise.Country?.id,
            Country: {
              name: currentEnterprise.Country?.name || "",
            },
            legalForm: currentEnterprise.legalForm || "",
            rccm: currentEnterprise.rccm,
            nui: currentEnterprise.niu || currentEnterprise.nui,
            subscriptionType: currentEnterprise.subscriptionType || "",
            subscriptionStatus: currentEnterprise.subscriptionStatus || "",
          });
        }
      }
    })();
  }, [session]);

  // 2. Chargement des pays
  useEffect(() => {
    (async () => {
      const countriesList = await providers.API.getAll(providers.APIUrl, "getCountries", null);
      setCountry(countriesList || []);
    })();
  }, []);

  // 3. Chargement des départements filtrés par entreprise
  useEffect(() => {
    if (!inputs.EnterpriseId && !enterpriseId) return;
    (async () => {
      const targetEnterpriseId = inputs.EnterpriseId || Number(enterpriseId);
      const departmentPostsList = await providers.API.getAll(providers.APIUrl, "getDepartmentPosts", null);
      const filteredDepartments = departmentPostsList.filter(
        (department: { EnterpriseId: number }) => department.EnterpriseId === targetEnterpriseId
      );
      setDepartmentPosts(filteredDepartments);
    })();
  }, [inputs.EnterpriseId, enterpriseId]);

  // 4. Chargement des villes filtrées par pays
  useEffect(() => {
    if (!inputs.CountryId) return;
    (async () => {
      const citiesList = await providers.API.getAll(providers.APIUrl, "getCities", null);
      const filteredCities = citiesList.filter(
        (city: any) => city.CountriesTypeId === inputs.CountryId || city.CountryId === inputs.CountryId
      );
      setCity(filteredCities);
    })();
  }, [inputs.CountryId]);

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

  // Soumission des modifications
  const handleSubmit = async () => {
    try {
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

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
         return toast.error("Champs invalides", "Veuillez renseigner tous les champs obligatoires.")
        }
      }

      setIsLoading(true);

      const response = await providers.API.update(
        "https://vps118934.serveur-vps.net:4001",
        "updateEnterprise",
        null,
        inputs,
        Number(enterpriseId)
      );
      
      if (response.status) {
        localStorage.removeItem("inputMemoryOfAddEnterprisePage");
        toast.success("Bravo", "Mise à jour effectuée avec succès.")
      }

    } catch (error) {
      console.log(error);
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
  };
}