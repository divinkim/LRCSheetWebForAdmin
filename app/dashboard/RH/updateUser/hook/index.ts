"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { providers } from "@/index";

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
  PlanningId: number | null;
  DistrictId: number | null;
  QuarterId: number | null;
  photo: string | null;
  role: string | null;
  DepartmentPostId: number | null;
  marialStatus: string | null;
  adminService: string | null;
  status: string | null;
  [key: string]: string | number | boolean | null | undefined;
};

export function UpdateUserHookModal() {
  const { data: session, status: sessionStatus } = useSession();
  const params = useParams();
  const userId = params?.id ? Number(params.id) : null;

  const [isLoading, setIsLoading] = useState(false);

  // Session
  const adminRole = (session?.user as any)?.role ?? null;
  const adminEnterpriseId = (session?.user as any)?.EnterpriseId
    ? Number((session?.user as any).EnterpriseId)
    : null;

  // Listes d'options
  const [getEnterprises, setGetEnterprises] = useState<any[]>([]);
  const [getDepartmentPosts, setGetDepartmentPosts] = useState<any[]>([]);
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
    ContractId: null,
    CountryId: null,
    CityId: null,
    DistrictId: null,
    PlanningId: null,
    QuarterId: null,
    photo: null,
    role: null,
    DepartmentPostId: null,
    marialStatus: null,
    adminService: null,
    status: null,
  });

  // 1. Initialisation : Chargement des entreprises & pays
  useEffect(() => {
    if (sessionStatus === "loading") return;

    (async () => {
      try {
        const [enterprises, countries] = await Promise.all([
          providers.API.getAll(providers.APIUrl, "getEnterprises", null),
          providers.API.getAll(providers.APIUrl, "getCountries", null),
        ]);

        setCountry(countries || []);

        if (adminEnterpriseId && adminEnterpriseId !== 1) {
          const filtered = (enterprises || []).filter(
            (e: { id: number }) => e.id === adminEnterpriseId
          );
          setGetEnterprises(filtered);
        } else {
          setGetEnterprises(enterprises || []);
        }
      } catch (error) {
        console.error("Erreur lors de l'initialisation :", error);
      }
    })();
  }, [sessionStatus, adminEnterpriseId]);

  // 2. Chargement des données de l'utilisateur à modifier
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const getUser = await providers.API.getOne(
          providers.APIUrl,
          "getUser",
          userId
        );

        if (getUser) {
          setInputs({
            firstname: getUser.firstname ?? null,
            lastname: getUser.lastname ?? null,
            birthDate: getUser.birthDate
              ? new Date(getUser.birthDate).toISOString().split("T")[0]
              : null,
            gender: getUser.gender ?? null,
            email: getUser.email ?? null,
            password: getUser.password ?? null,
            phone: getUser.phone ?? null,
            EnterpriseId: getUser.EnterpriseId ?? null,
            PostId: getUser.PostId ?? null,
            SalaryId: getUser.SalaryId ?? null,
            ContractTypeId: getUser.ContractTypeId ?? null,
            ContractId: getUser.ContractId ?? null,
            CountryId: getUser.CountryId ?? null,
            PlanningId: getUser.PlanningId ?? null,
            CityId: getUser.CityId ?? null,
            DistrictId: getUser.DistrictId ?? null,
            QuarterId: getUser.QuarterId ?? null,
            photo: getUser.photo ?? null,
            role: getUser.role ?? null,
            DepartmentPostId: getUser.DepartmentPostId ?? null,
            marialStatus: getUser.marialStatus ?? null,
            adminService: getUser.adminService ?? null,
            status: getUser.status ? "Actif" : "Inactif",
          });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
      }
    })();
  }, [userId]);

  // 3. Plannings
  useEffect(() => {
    if (!inputs.EnterpriseId) return;
    (async () => {
      const plannings = await providers.API.getAll(
        providers.APIUrl,
        "getPlannings",
        null
      );
      if (adminRole !== "Super-Admin") {
        setPlannings(
          (plannings || []).filter(
            (item: { EnterpriseId: number }) =>
              item.EnterpriseId === inputs.EnterpriseId
          )
        );
      } else {
        setPlannings(plannings || []);
      }
    })();
  }, [inputs.EnterpriseId, adminRole]);

  // 4. Départements
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setGetDepartmentPosts([]);
      return;
    }
    (async () => {
      const departments = await providers.API.getAll(
        providers.APIUrl,
        "getDepartmentPosts",
        null
      );
      if (adminRole !== "Super-Admin") {
        setGetDepartmentPosts(
          (departments || []).filter(
            (dept: { EnterpriseId: number }) =>
              dept.EnterpriseId === inputs.EnterpriseId
          )
        );
      } else {
        setGetDepartmentPosts(departments || []);
      }
    })();
  }, [inputs.EnterpriseId, adminRole]);

  // 5. Postes
  useEffect(() => {
    if (!inputs.DepartmentPostId || !inputs.EnterpriseId) {
      setPosts([]);
      return;
    }
    (async () => {
      const posts = await providers.API.getAll(
        providers.APIUrl,
        "getPosts",
        null
      );
      setPosts(
        (posts || []).filter(
          (post: { EnterpriseId: number; DepartmentPostId: number }) =>
            post.DepartmentPostId === inputs.DepartmentPostId &&
            post.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.DepartmentPostId, inputs.EnterpriseId]);

  // 6. Salaires
  useEffect(() => {
    if (!inputs.PostId || !inputs.EnterpriseId) {
      setSalary([]);
      return;
    }
    (async () => {
      const salaries = await providers.API.getAll(
        providers.APIUrl,
        "getSalaries",
        null
      );
      setSalary(
        (salaries || []).filter(
          (salary: { EnterpriseId: number; PostId: number }) =>
            salary.PostId === inputs.PostId &&
            salary.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.PostId, inputs.EnterpriseId]);

  // 7. Types de contrats
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setContractTypes([]);
      return;
    }
    (async () => {
      const types = await providers.API.getAll(
        providers.APIUrl,
        "getContractTypes",
        null
      );
      setContractTypes(
        (types || []).filter(
          (ct: { EnterpriseId: number }) => ct.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.EnterpriseId]);

  // 8. Contrats
  useEffect(() => {
    if (!inputs.ContractTypeId || !inputs.EnterpriseId) {
      setContracts([]);
      return;
    }
    (async () => {
      const contracts = await providers.API.getAll(
        providers.APIUrl,
        "getContracts",
        null
      );
      setContracts(
        (contracts || []).filter(
          (c: { EnterpriseId: number; ContractTypeId: number }) =>
            c.ContractTypeId === inputs.ContractTypeId &&
            c.EnterpriseId === inputs.EnterpriseId
        )
      );
    })();
  }, [inputs.ContractTypeId, inputs.EnterpriseId]);

  // 9. Villes
  useEffect(() => {
    if (!inputs.CountryId) {
      setCity([]);
      return;
    }
    (async () => {
      const cities = await providers.API.getAll(
        providers.APIUrl,
        "getCities",
        null
      );
      setCity(
        (cities || []).filter((city: any) => city.CountriesTypeId === inputs.CountryId)
      );
    })();
  }, [inputs.CountryId]);

  // 10. Arrondissements
  useEffect(() => {
    if (!inputs.CityId) {
      setDistrict([]);
      return;
    }
    (async () => {
      const districts = await providers.API.getAll(
        providers.APIUrl,
        "getDistricts",
        null
      );
      setDistrict(
        (districts || []).filter((district: any) => district.CityId === inputs.CityId)
      );
    })();
  }, [inputs.CityId]);

  // 11. Quartiers
  useEffect(() => {
    if (!inputs.DistrictId) {
      setQuarter([]);
      return;
    }
    (async () => {
      const quarters = await providers.API.getAll(
        providers.APIUrl,
        "getQuarters",
        null
      );
      setQuarter(
        (quarters || []).filter((q: any) => q.DistrictId === inputs.DistrictId)
      );
    })();
  }, [inputs.DistrictId]);

  // Options dynamiques
  const dynamicOptions = [
    {
      alias: "EnterpriseId",
      arrayData: getEnterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "PlanningId",
      arrayData: getPlannings
        .filter((item) => item.id && item.PlanningType)
        .map((item) => ({ value: item.id, title: item.PlanningType.title })),
    },
    {
      alias: "DepartmentPostId",
      arrayData: getDepartmentPosts
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "PostId",
      arrayData: getPosts
        .filter((item) => item.id && item.title)
        .map((item) => ({ value: item.id, title: item.title })),
    },
    {
      alias: "SalaryId",
      arrayData: getSalary
        .filter((item) => item.id && item.netSalary)
        .map((item) => ({ value: item.id, title: item.netSalary })),
    },
    {
      alias: "ContractTypeId",
      arrayData: getContractTypes
        .filter((item) => item.id && item.title)
        .map((item) => ({ value: item.id, title: item.title })),
    },
    {
      alias: "ContractId",
      arrayData: getContracts
        .filter((item) => item.id && item.delay)
        .map((item) => ({ value: item.id, title: item.delay })),
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
    {
      alias: "DistrictId",
      arrayData: getDistrict
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "QuarterId",
      arrayData: getQuarter
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
  ];

  // Options statiques
  const staticOptions = [
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
        { title: "Super-Admin", value: "Super administrateur" },
        { title: "Administrateur de contrôle", value: "Moderator-Admin" },
        { title: "Supervisor-Admin", value: "Administrateur de gestion" },
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
        { title: "Fiancé", value: "Fiancé" },
        { title: "En couple", value: "En couple" },
        { title: "Divorcé(e)", value: "Divorcé(e)" },
      ],
    },
  ];

  // Soumission
  const handleSubmit = async () => {
    if (!userId) return;

    const requireFields = {
      firstname: inputs.firstname,
      gender: inputs.gender,
      password: inputs.password,
      EnterpriseId: inputs.EnterpriseId,
      email: inputs.email,
      role: inputs.role,
      phone: inputs.phone,
      CityId: inputs.CityId,
      CountryId: inputs.CountryId,
    };

    for (const [key, value] of Object.entries(requireFields)) {
      if (!value) {
        return providers.alertMessage(
          false,
          "Champs invalides",
          "Veuillez renseigner tous les champs obligatoires",
          null
        );
      }
    }

    try {
      setIsLoading(true);

      const response = await providers.API.update(
        providers.APIUrl,
        "updateUser",
        null,
        {
          ...inputs,
          birthDate: inputs.birthDate
            ? new Date(String(inputs.birthDate)).toISOString()
            : null,
          status: inputs.status === "Actif",
        },
        userId
      );

      providers.alertMessage(
        response.status,
        response.title,
        response.message,
        response.status ? "/dashboard/RH/updateUser/" + userId : null
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
      providers.alertMessage(
        false,
        "Erreur",
        "Une erreur est survenue lors de la mise à jour.",
        null
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dynamicOptions,
    staticOptions,
    setInputs,
    inputs,
    handleSubmit,
    isLoading,
    setIsLoading,
    adminRole,
  };
}