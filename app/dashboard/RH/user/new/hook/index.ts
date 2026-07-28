'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";

export type InputsValue = {
  firstname: string | null;
  lastname: string | null;
  birthDate: string | null;
  gender: string | null;
  email: string | null;
  password: string | null;
  phone: string | null;
  EnterpriseId: number | null;
  PostId: number | null;
  SalaryId: number | null;
  ContractTypeId: number | null;
  ContractId: number | null;
  CountryId: number | null;
  CityId: number | null;
  DistrictId: number | null;
  PlanningId: number | null;
  QuarterId: number | null;
  photo: string | null;
  role: string | null;
  DepartmentPostId: number | null;
  marialStatus: string | null;
  adminService: string | null;
  status: string | null;
  [key: string]: string | number | boolean | null | undefined;
};

export default function AddUserHookModal() {
  const { data: session, status: sessionStatus } = useSession();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Informations issues de la session NextAuth
  const adminRole = (session?.user as any)?.role ?? null;
  const sessionEnterpriseId = (session?.user as any)?.EnterpriseId 
    ? Number((session?.user as any).EnterpriseId) 
    : null;

  // Listes dynamiques depuis l'API
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getDepartmentPosts, setDepartmentPosts] = useState<any[]>([]);
  const [getPosts, setPosts] = useState<any[]>([]);
  const [getSalary, setSalary] = useState<any[]>([]);
  const [getContractTypes, setContractTypes] = useState<any[]>([]);
  const [getContracts, setContracts] = useState<any[]>([]);
  const [getCountry, setCountry] = useState<any[]>([]);
  const [getCity, setCity] = useState<any[]>([]);
  const [getDistrict, setDistrict] = useState<any[]>([]);
  const [getQuarter, setQuarter] = useState<any[]>([]);
  const [getPlannings, setPlannings] = useState<any[]>([]);

  // État du formulaire
  const [inputs, setInputs] = useState<InputsValue>({
    firstname: null,
    lastname: null,
    birthDate: null,
    gender: null,
    email: null,
    password: null,
    phone: null,
    EnterpriseId: null,
    PostId: null,
    SalaryId: null,
    ContractTypeId: null,
    PlanningId: null,
    ContractId: null,
    CountryId: null,
    CityId: null,
    DistrictId: null,
    QuarterId: null,
    photo: null,
    role: null,
    DepartmentPostId: null,
    marialStatus: null,
    adminService: null,
    status: "",
  });

  // 1. Initialisation : Synchronisation session & Chargement des données de base
  useEffect(() => {
    if (sessionStatus === "loading") return;

    (async () => {
      // Restauration de la mémoire du formulaire si présente
      const getInputMemory = localStorage.getItem("inputMemoryOfAddUserPage");
      if (getInputMemory) {
        setInputs(JSON.parse(getInputMemory));
      } else if (sessionEnterpriseId && adminRole !== "Super-Admin") {
        setInputs((prev) => ({ ...prev, EnterpriseId: sessionEnterpriseId }));
      }

      // Chargement des entreprises et pays
      try {
        const [enterprisesData, countriesData] = await Promise.all([
          providers.API.getAll(providers.APIUrl, "getEnterprises", null),
          providers.API.getAll(providers.APIUrl, "getCountries", null),
        ]);
        setEnterprises(enterprisesData || []);
        setCountry(countriesData || []);
      } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
      }
    })();
  }, [sessionStatus, sessionEnterpriseId, adminRole]);

  // 2. Plannings
  useEffect(() => {
    if (!inputs.EnterpriseId) return;
    (async () => {
      const plannings = await providers.API.getAll(providers.APIUrl, "getPlannings", null);
      if (adminRole !== "Super-Admin") {
        setPlannings(plannings.filter((item: any) => item.EnterpriseId === inputs.EnterpriseId));
      } else {
        setPlannings(plannings);
      }
    })();
  }, [inputs.EnterpriseId, adminRole]);

  // 3. Départements
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setDepartmentPosts([]);
      return;
    }
    (async () => {
      const departments = await providers.API.getAll(providers.APIUrl, "getDepartmentPosts", null);
      setDepartmentPosts(departments.filter((dept: any) => dept.EnterpriseId === inputs.EnterpriseId));
    })();
  }, [inputs.EnterpriseId]);

  // 4. Postes
  useEffect(() => {
    if (!inputs.DepartmentPostId || !inputs.EnterpriseId) {
      setPosts([]);
      return;
    }
    (async () => {
      const posts = await providers.API.getAll(providers.APIUrl, "getPosts", null);
      setPosts(
        posts.filter(
          (post: any) => post.DepartmentPostId === inputs.DepartmentPostId && post.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.DepartmentPostId, inputs.EnterpriseId]);

  // 5. Salaires
  useEffect(() => {
    if (!inputs.PostId || !inputs.EnterpriseId) {
      setSalary([]);
      return;
    }
    (async () => {
      const salaries = await providers.API.getAll(providers.APIUrl, "getSalaries", null);
      setSalary(
        salaries.filter((s: any) => s.PostId === inputs.PostId && s.EnterpriseId === inputs.EnterpriseId)
      );
    })();
  }, [inputs.PostId, inputs.EnterpriseId]);

  // 6. Types de contrat
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setContractTypes([]);
      return;
    }
    (async () => {
      const types = await providers.API.getAll(providers.APIUrl, "getContractTypes", null);
      setContractTypes(types.filter((ct: any) => ct.EnterpriseId === inputs.EnterpriseId));
    })();
  }, [inputs.EnterpriseId]);

  // 7. Contrats
  useEffect(() => {
    if (!inputs.ContractTypeId || !inputs.EnterpriseId) {
      setContracts([]);
      return;
    }
    (async () => {
      const contracts = await providers.API.getAll(providers.APIUrl, "getContracts", null);
      setContracts(
        contracts.filter(
          (c: any) => c.ContractTypeId === inputs.ContractTypeId && c.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.ContractTypeId, inputs.EnterpriseId]);

  // 8. Villes
  useEffect(() => {
    if (!inputs.CountryId) {
      setCity([]);
      return;
    }
    (async () => {
      const cities = await providers.API.getAll(providers.APIUrl, "getCities", null);
      setCity(cities.filter((c: any) => c.CountriesTypeId === inputs.CountryId));
    })();
  }, [inputs.CountryId]);

  // 9. Arrondissements
  useEffect(() => {
    if (!inputs.CityId) {
      setDistrict([]);
      return;
    }
    (async () => {
      const districts = await providers.API.getAll(providers.APIUrl, "getDistricts", null);
      setDistrict(districts.filter((d: any) => d.CityId === inputs.CityId));
    })();
  }, [inputs.CityId]);

  // 10. Quartiers
  useEffect(() => {
    if (!inputs.DistrictId) {
      setQuarter([]);
      return;
    }
    (async () => {
      const quarters = await providers.API.getAll(providers.APIUrl, "getQuarters", null);
      setQuarter(quarters.filter((q: any) => q.DistrictId === inputs.DistrictId));
    })();
  }, [inputs.DistrictId]);

  // Listes dynamiques pour les sélecteurs
  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
      arrayData: getEnterprises.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "PlanningId",
      arrayData: getPlannings.filter((item) => item.id && item.PlanningType).map((item) => ({ value: item.id, title: item.PlanningType.title })),
    },
    {
      alias: "DepartmentPostId",
      arrayData: getDepartmentPosts.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "PostId",
      arrayData: getPosts.filter((item) => item.id && item.title).map((item) => ({ value: item.id, title: item.title })),
    },
    {
      alias: "SalaryId",
      arrayData: getSalary.filter((item) => item.id && item.netSalary).map((item) => ({ value: item.id, title: item.netSalary })),
    },
    {
      alias: "ContractTypeId",
      arrayData: getContractTypes.filter((item) => item.id && item.title).map((item) => ({ value: item.id, title: item.title })),
    },
    {
      alias: "ContractId",
      arrayData: getContracts.filter((item) => item.id && item.delay).map((item) => ({ value: item.id, title: item.delay })),
    },
    {
      alias: "CountryId",
      arrayData: getCountry.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "CityId",
      arrayData: getCity.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "DistrictId",
      arrayData: getDistrict.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "QuarterId",
      arrayData: getQuarter.filter((item) => item.id && item.name).map((item) => ({ value: item.id, title: item.name })),
    },
  ];

  // Listes statiques
  const staticArrayData = [
    {
      alias: "gender",
      arrayData: [
        { title: "Homme", value: "Homme" },
        { title: "Femme", value: "Femme" },
        { title: "Aucun", value: "Aucun" },
      ],
    },
    {
      alias: "status",
      arrayData: [
        { title: "Actif", value: "Actif" },
        { title: "Inactif", value: "Inactif" },
      ],
    },
    {
      alias: "role",
      arrayData: [
        { title: "Super administrateur", value: "Super-Admin" },
        { title: "Administrateur général", value: "Supervisor-Admin" },
        { title: "Administrateur de contrôle", value: "Controllor-Admin" },
        { title: "Utilisateur client", value: "client" },
      ],
    },
    {
      alias: "adminService",
      arrayData: [
        { title: "Administration", value: "ADMINISTRATION" },
        { title: "Ressources humaines", value: "RH" },
        { title: "Comptabilité", value: "COMPTA" },
      ],
    },
    {
      alias: "marialStatus",
      arrayData: [
        { title: "Célibataire", value: "Célibataire" },
        { title: "Fiancé(e)", value: "Fiancé" },
        { title: "En couple", value: "En couple" },
        { title: "Divorcé(e)", value: "Divorcé(e)" },
      ],
    },
  ];

  // Soumission
  const handleSubmit = async () => {
    try {
      const requiredFields = {
        firstname: inputs.firstname,
        gender: inputs.gender,
        password: inputs.password,
        EnterpriseId: inputs.EnterpriseId,
        email: inputs.email,
        role: inputs.role,
        CountryId: inputs.CountryId,
        CityId: inputs.CityId,
        status: inputs.status,
      };

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return toast.error(
            "Champ obligatoire manquant",
            "Veuillez renseigner tous les champs obligatoires."
          );
        }
      }

      setIsLoading(true);

      const payload = {
        ...inputs,
        status: inputs.status === "Actif",
      };

      const response = await providers.API.post(
        providers.APIUrl,
        "createUser",
        null,
        payload
      );

      if (response?.status) {
        localStorage.removeItem("inputMemoryOfAddUserPage");
        toast.success("Succès", "Collaborateur enregistré avec succès.");
      }
    } catch (error) {
      console.error("Erreur lors de la création :", error);
      const errText = error instanceof Error ? error.message : "Une erreur inattendue est survenue.";
      toast.error("Erreur", errText);
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
    isSessionLoading: sessionStatus === "loading",
  };
}