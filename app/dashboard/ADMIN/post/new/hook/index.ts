"use client";

import { providers } from "@/index";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type InputsValue = {
  title: string | null;
  description: string | null;
  EnterpriseId: number | null;
  DepartmentPostId: number | null;
  Enterprise: {
    name: string;
  };
  DepartmentPost: {
    name: string;
  };
  [key: string]: any;
};

export default function useAddPost() {
  //  Récupération de la session NextAuth
  const { data: session, status } = useSession();

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

  const [enterpriseIdOfAdmin, setEnterpriseIdOfAdmin] = useState<string | number | null>(null);
  const [adminRole, setAdminRole] = useState<string | null>(null);

  const [inputs, setInputs] = useState<InputsValue>({
    EnterpriseId: null,
    DepartmentPostId: null,
    description: null,
    title: null,
    Enterprise: {
      name: "",
    },
    DepartmentPost: {
      name: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  //  Synchronisation des données de l'administrateur depuis la session NextAuth
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role || null;
      const enterpriseId = (session.user as any).EnterpriseId || null;

      setAdminRole(role);
      setEnterpriseIdOfAdmin(enterpriseId);
    }
  }, [session, status]);

  //  Récupération des entreprises et filtrage selon le rôle issu de useSession
  useEffect(() => {
    (async () => {
      // Restauration du brouillon en cache local s'il existe
      const getInputMemory = localStorage.getItem("inputMemoryOfAddPostPage");
      if (getInputMemory) {
        setInputs(JSON.parse(getInputMemory));
      }

      // Attendre que la session soit chargée avant d'appliquer les filtres
      if (status === "loading") return;

      const role = (session?.user as any)?.role;
      const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId;

      const enterprises = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);

      if (role !== "Super-Admin" && enterpriseIdOfAdmin) {
        const getEnterprisesByAdminRole = enterprises.filter(
          (item: { id: number }) => item.id === Number(enterpriseIdOfAdmin)
        );
        setEnterprises(getEnterprisesByAdminRole);
      } else {
        setEnterprises(enterprises);
      }
    })();
  }, [session, status]);

  //  Récupération des départements selon l'entreprise sélectionnée
  useEffect(() => {
    (async () => {
      if (!inputs.EnterpriseId) {
        setDepartmentPosts([]);
        return;
      }
      const departmentPosts = await providers.API.getAll(providers.APIUrl, "getDepartmentPosts", null);
      const filterDepartmentsByAdminEnterpriseId = departmentPosts.filter(
        (department: { EnterpriseId: number }) => department.EnterpriseId === inputs.EnterpriseId
      );
      setDepartmentPosts(filterDepartmentsByAdminEnterpriseId);
    })();
  }, [inputs.EnterpriseId]);

  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
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
  ];

  const staticArrayData = [
    {
      alias: "",
      arrayData: [
        {
          title: "",
          value: "",
        },
      ],
    },
  ];

  const handleSubmit = async () => {
    const requireFields = {
      Entreprises: inputs.EnterpriseId,
      Départements: inputs.DepartmentPostId,
      Titre: inputs.title,
      Description: inputs.description,
    };

    for (const [key, value] of Object.entries(requireFields)) {
      if (!value) {
        return providers.alertMessage(
          false,
          "Champs invalides",
          `Le champ ${key} est obligatoire`,
          "/dashboard/addUser"
        );
      }
    }

    setIsLoading(true);

    const response = await providers.API.post(providers.APIUrl, "createPoste", null, inputs);

    if (response.status) {
      localStorage.removeItem("inputMemoryOfAddPostPage");
    }

    providers.alertMessage(
      response.status,
      response.title,
      response.message,
      response.status ? "/dashboard/ADMIN/addPost" : null
    );

    setIsLoading(false);
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