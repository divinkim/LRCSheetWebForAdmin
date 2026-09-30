'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { CitiesResponseDto, ContractsResponseDto, ContractTypesResponseDto, CountryResponseDto, DepartmentsResponseDto, DistrictResponseDto, EnterprisesResponseDto, PlanningsResponseDto, PostsResponseDto, QuarterResponseDto, QuartersResponseDto, SalariesResponseDto, UserResponseDto } from "@/types/global";

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
  const userId = (session?.user as any)?.id ?? null;

  const adminEnterpriseId = (session?.user as any)?.EnterpriseId
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


  // 1. Initialisation : Chargement des entreprises & pays
  useEffect(() => {
    if (sessionStatus === "loading") return;

    (async () => {
      try {
        const [enterprises, countries] = await Promise.all([
          providers.API.getAll<EnterprisesResponseDto>(providers.APIUrl, "enterprises", null),
          providers.API.getAll<CountryResponseDto>(providers.APIUrl, "countries", null),
        ]);

        setCountry(countries.data);

        if (adminEnterpriseId && adminEnterpriseId !== 1) {
          const filtered = enterprises.data.filter(
            (e: { id: number }) => e.id === adminEnterpriseId
          );
          setEnterprises(filtered);
        } else {
          setEnterprises(enterprises.data);
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
        const getUser = await providers.API.getOne<UserResponseDto>(
          providers.APIUrl,
          "users",
          userId
        );

        setInputs({
          firstname: getUser.data.firstname ?? null,
          lastname: getUser.data.lastname ?? null,
          birthDate: getUser.data.birthDate
            ? new Date(getUser.data.birthDate).toISOString().split("T")[0]
            : null,
          gender: getUser.data.gender ?? null,
          email: getUser.data.email ?? null,
          password: getUser.data.password ?? null,
          phone: getUser.data.phone ?? null,
          EnterpriseId: getUser.data.EnterpriseId ?? null,
          PostId: getUser.data.PostId ?? null,
          SalaryId: getUser.data.SalaryId ?? null,
          ContractTypeId: getUser.data.ContractTypeId ?? null,
          ContractId: getUser.data.ContractId ?? null,
          CountryId: getUser.data.CountryId ?? null,
          PlanningId: getUser.data.PlanningId ?? null,
          CityId: getUser.data.CityId ?? null,
          DistrictId: getUser.data.DistrictId ?? null,
          QuarterId: getUser.data.QuarterId ?? null,
          photo: getUser.data.photo ?? null,
          role: getUser.data.role ?? null,
          DepartmentPostId: getUser.data.DepartmentPostId ?? null,
          marialStatus: getUser.data.marialStatus ?? null,
          adminService: getUser.data.adminService ?? null,
          status: getUser.data.status ? "Actif" : "Inactif",
        });
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
      }
    })();
  }, [userId]);

  // 3. Plannings
  useEffect(() => {
    if (!inputs.EnterpriseId) return;
    (async () => {
      const plannings = await providers.API.getAll<PlanningsResponseDto>(
        providers.APIUrl,
        "plannings",
        null
      );
      if (adminRole !== "Super-Admin") {
        setPlannings(
          plannings.data.filter(
            (item: { EnterpriseId: number }) =>
              item.EnterpriseId === inputs.EnterpriseId
          )
        );
      } else {
        setPlannings(plannings.data);
      }
    })();
  }, [inputs.EnterpriseId, adminRole]);

  // 4. Départements
  useEffect(() => {
    (async () => {
      const departments = await providers.API.getAll<DepartmentsResponseDto>(
        providers.APIUrl,
        "departments",
        null
      );
      if (adminRole !== "Super-Admin") {
        setDepartmentPosts(
          departments.data.filter(
            dept => dept.EnterpriseId === inputs.EnterpriseId
          )
        );
      } else {
        setDepartmentPosts(departments.data);
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
      const posts = await providers.API.getAll<PostsResponseDto>(
        providers.APIUrl,
        "posts",
        null
      );
      setPosts(
        posts.data.filter(
          post =>
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
      const salaries = await providers.API.getAll<SalariesResponseDto>(
        providers.APIUrl,
        "salaries",
        null
      );
      setSalary(
        salaries.data.filter(
          salary =>
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
      const types = await providers.API.getAll<ContractTypesResponseDto>(
        providers.APIUrl,
        "contract-types",
        null
      );
      setContractTypes(
        types.data.filter(
          ct => ct.EnterpriseId === inputs.EnterpriseId
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
      const contracts = await providers.API.getAll<ContractsResponseDto>(
        providers.APIUrl,
        "contracts",
        null
      );
      setContracts(
        contracts.data.filter(
          c =>
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
      const cities = await providers.API.getAll<CitiesResponseDto>(
        providers.APIUrl,
        "cities",
        null
      );
      setCity(
        cities.data.filter((city: any) => city.CountriesTypeId === inputs.CountryId)
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
      const districts = await providers.API.getAll<DistrictResponseDto>(
        providers.APIUrl,
        "districts",
        null
      );
      setDistrict(
        (districts || []).data.filter((district: any) => district.CityId === inputs.CityId)
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
      const quarters = await providers.API.getAll<QuartersResponseDto>(
        providers.APIUrl,
        "quarters",
        null
      );
      setQuarter(
        (quarters || []).data.filter((q: any) => q.DistrictId === inputs.DistrictId)
      );
    })();
  }, [inputs.DistrictId]);

  // Options dynamiques
  const dynamicArrayData = [
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

      const res = await providers.API.post<UserResponseDto>(
        providers.APIUrl,
        "users",
        null,
        payload
      );
      console.log(res)
      localStorage.removeItem("inputMemoryOfAddUserPage");
      toast.success("Succès", "Collaborateur enregistré avec succès.");
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