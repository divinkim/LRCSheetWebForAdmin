"use client";

import { useToast } from "@/components/toast";
import { providers } from "@/index";
import { DepartmentsResponseDto, EnterprisesResponseDto } from "@/types/global";
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
  const toast = useToast()
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [EnterpriseIdOfAdmin, setEnterpriseIdOfAdmin] = useState<string | number | null>(null);
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

  //  Récupération des entreprises et filtrage selon le rôle issu de useSession
  useEffect(() => {
    (async () => {
      const getInputMemory = localStorage.getItem("inputMemoryOfAddPostPage");
      if (getInputMemory) {
        setInputs(JSON.parse(getInputMemory));
      }

      const AdminRole = (session?.user as any)?.role;
      const EnterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId;
      const enterprises = await providers.API.getAll<EnterprisesResponseDto>(providers.APIUrl, "enterprises", null);
      if (AdminRole !== "Super_Admin_Platform") {
        const getEnterprisesByAdminRole = enterprises.data.filter(
          item => item.MainEnterpriseId === Number(EnterpriseIdOfAdmin)
        );
        setEnterprises(getEnterprisesByAdminRole);
      } else {
        setEnterprises(enterprises.data);
      }
      setAdminRole(AdminRole);
      setEnterpriseIdOfAdmin(EnterpriseIdOfAdmin);
    })();
  }, [session]);
  //  Récupération des départements selon l'entreprise sélectionnée
  useEffect(() => {
    (async () => {
      const departments = await providers.API.getAll<DepartmentsResponseDto>(providers.APIUrl, "departments", null);
      const departmentsByEnterpriseId = departments.data.filter(
        department => department.EnterpriseId === inputs.EnterpriseId
      );
      setDepartments(departmentsByEnterpriseId);
    })();
  }, [inputs.EnterpriseId]);

  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
      arrayData: enterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "DepartmentPostId",
      arrayData: departments
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
    try {
      const requireFields = {
        "Entreprises": inputs.EnterpriseId,
        "Départments": inputs.DepartmentPostId,
        "Titre": inputs.title,
        "Description": inputs.description,
      };

      for (const [key, value] of Object.entries(requireFields)) {
        if (!value) {
          return toast.info("Champs invalides", `Le champ ${key} est obligatoire`);
        }
      }

      setIsLoading(true);

      await providers.API.post(providers.APIUrl, "posts", null, inputs);
      localStorage.removeItem("inputMemoryOfAddPostPage");
      toast.success("Bravo", "Opération réussie");
      window.location.reload();
    } catch (error) {

    } finally {
      setIsLoading(false)
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