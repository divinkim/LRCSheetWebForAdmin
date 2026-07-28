"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { providers } from "@/index";

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

export default function useAddDepartment() {
  const { data: session, status } = useSession();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState("");
  const [enterpriseIdOfAdmin, setEnterpriseIdOfAdmin] = useState("")
  // Valeurs extraites de la session NextAuth
  useEffect(() => {
    if (status === "authenticated" && session.user) {
      const user = session?.user as (typeof session.user & { role?: string; EnterpriseId?: number | string }) | undefined;

      const adminRole = user?.role ?? null;
      const enterpriseIdOfAdmin = user?.EnterpriseId ?? null;
      setAdminRole(adminRole ?? "");
      setEnterpriseIdOfAdmin(String(enterpriseIdOfAdmin))
    }
  }, [])

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

  // 1. Récupération des données locales et API
  useEffect(() => {
    // Si la session est encore en cours de chargement, on attend
    if (status === "loading") return;

    (async () => {
      // Restauration de la mémoire du formulaire
      const savedInputs = localStorage.getItem("inputMemoryOfAddDepartmentPage");
      if (savedInputs) {
        try {
          setInputs(JSON.parse(savedInputs));
        } catch (error) {
          console.error("Erreur de lecture du localStorage :", error);
        }
      }

      // Récupération des entreprises via l'API
      try {
        const fetchedEnterprises = await providers.API.getAll(
          providers.APIUrl,
          "getEnterprises",
          null
        );

        if (Array.isArray(fetchedEnterprises)) {
          // Filtrage selon le rôle de l'administrateur
          if (adminRole !== "Super-Admin" && enterpriseIdOfAdmin) {
            const filteredEnterprises = fetchedEnterprises.filter(
              (item: { id: number }) => item.id === Number(enterpriseIdOfAdmin)
            );
            setEnterprises(filteredEnterprises);
          } else {
            setEnterprises(fetchedEnterprises);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises :", error);
      }
    })();
  }, [status, adminRole, enterpriseIdOfAdmin]);

  // 2. Options dynamiques pour le composant UI
  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
      arrayData: enterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({
          value: item.id,
          title: item.name,
        })),
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

  // 3. Soumission du formulaire
  const handleSubmit = async () => {
    const requiredFields = {
      Entreprise: inputs.EnterpriseId,
      Titre: inputs.title, // Corrected key check from EnterpriseId to title
      Description: inputs.description,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return providers.alertMessage(
          false,
          "Champs invalides",
          `Le champ ${key} est obligatoire.`,
          null
        );
      }
    }

    setIsLoading(true);

    try {
      const response = await providers.API.post(
        providers.APIUrl,
        "createDepartmentPost",
        null,
        inputs
      );

      if (response.status) {
        localStorage.removeItem("inputMemoryOfAddDepartmentPage");
      }

      providers.alertMessage(
        response.status,
        response.title,
        response.message,
        response.status ? "/dashboard/ADMIN/addDepartment" : null
      );
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
      providers.alertMessage(
        false,
        "Erreur",
        "Une erreur est survenue lors de la création du département.",
        null
      );
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