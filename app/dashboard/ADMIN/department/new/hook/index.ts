"use client";

import { useToast } from "@/components/toast";
import { providers } from "@/index";
import { EnterprisesResponseDto } from "@/types/global";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type InputsValue = {
  name: string | null;
  description: string | null;
  EnterpriseId: number | null;
  Enterprise: {
    name: string;
  };
  [key: string]: any;
};

export default function useAddDepartment() {
  // Récupération de la session NextAuth et du Toast
  const { data: session } = useSession();
  const toast = useToast();

  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [EnterpriseIdOfAdmin, setEnterpriseIdOfAdmin] = useState<string | number | null>(null);

  const [inputs, setInputs] = useState<InputsValue>({
    EnterpriseId: null,
    description: null,
    name: null,
    Enterprise: {
      name: "",
    },
  });

  // Récupération des données locales et des entreprises avec filtrage par rôle
  useEffect(() => {
    (async () => {
      // Restauration de la mémoire du formulaire
      const getInputMemory = localStorage.getItem("inputMemoryOfAddDepartmentPage");
      if (getInputMemory) {
        try {
          setInputs(JSON.parse(getInputMemory));
        } catch (error) {
          console.error("Erreur de lecture du localStorage :", error);
        }
      }

      const AdminRole = (session?.user as any)?.role;
      const AdminEnterpriseId = (session?.user as any)?.EnterpriseId;

      try {
        const fetchedEnterprises = await providers.API.getAll<EnterprisesResponseDto>(
          providers.APIUrl,
          "enterprises",
          null
        );

        if (fetchedEnterprises && Array.isArray(fetchedEnterprises.data)) {
          if (AdminRole !== "Super_Admin_Platform") {
            const filteredEnterprises = fetchedEnterprises.data.filter(
              (item: any) => item.id === Number(AdminEnterpriseId) || item.MainEnterpriseId === Number(AdminEnterpriseId)
            );
            setEnterprises(filteredEnterprises);
          } else {
            setEnterprises(fetchedEnterprises.data);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises :", error);
      }

      setAdminRole(AdminRole);
      setEnterpriseIdOfAdmin(AdminEnterpriseId);
    })();
  }, [session]);

  // Options dynamiques pour le composant UI
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

  const handleSubmit = async () => {
    try {
      const requiredFields = {
        "Entreprise": inputs.EnterpriseId,
        "Nom": inputs.name,
        "Description": inputs.description,
      };

      for (const [key, value] of Object.entries(requiredFields)) {
        if (!value) {
          return toast.info("Champs invalides", `Le champ ${key} est obligatoire.`);
        }
      }

      setIsLoading(true);

      await providers.API.post(
        providers.APIUrl,
        "departments",
        null,
        inputs
      );

      localStorage.removeItem("inputMemoryOfAddDepartmentPage");
      toast.success("Bravo", "Opération réussie");
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de l'envoi :", error);
      toast.error("Erreur", "Une erreur est survenue lors de la création du département.");
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