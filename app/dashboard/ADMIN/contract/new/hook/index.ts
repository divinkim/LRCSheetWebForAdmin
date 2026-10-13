"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { ContractTypesResponseDto, EnterprisesResponseDto } from "@/types/global";
import { useToast } from "@/components/toast";

type InputsValue = {
  EnterpriseId: number | null;
  startDate: string | null;
  endDate: string | null;
  delay: string | null;
  ContractTypeId: number | null;
  [key: string]: string | number | boolean | null | any;
};

const INITIAL_INPUTS: InputsValue = {
  EnterpriseId: null,
  startDate: null,
  endDate: null,
  delay: null,
  ContractTypeId: null,
};

export default function useAddContract() {
  const { data: session } = useSession();
  const toast = useToast();

  const [inputs, setInputs] = useState<InputsValue>(INITIAL_INPUTS);
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getContractTypes, setContractTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [enterpriseIdOfAdmin, setEnterpriseIdOfAdmin] = useState<string | number | null>(null);

  // 1. Restauration du brouillon de formulaire depuis sessionStorage au montage
  useEffect(() => {
    const storedInputMemory = sessionStorage.getItem("inputMemoryOfAddContractPage");
    if (storedInputMemory) {
      try {
        setInputs(JSON.parse(storedInputMemory));
      } catch {
        setInputs(INITIAL_INPUTS);
      }
    }
  }, []);

  // 2. Chargement des entreprises et récupération des rôles depuis la session
  useEffect(() => {
    const fetchEnterprises = async () => {
      const AdminRole = (session?.user as any)?.adminRole ?? null;
      const AdminEnterpriseId = (session?.user as any)?.EnterpriseId ?? null;

      try {
        const enterprisesData = await providers.API.getAll<EnterprisesResponseDto>(
          providers.APIUrl,
          "enterprises",
          null
        );

        if (enterprisesData && Array.isArray(enterprisesData.data)) {
          if (AdminRole !== "Super_Admin_Platform") {
            const filteredEnterprises = enterprisesData.data.filter(
              (item) => item.MainEnterpriseId === Number(AdminEnterpriseId)
            );
            setEnterprises(filteredEnterprises);
          } else {
            setEnterprises(enterprisesData.data);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises :", error);
      }

      setAdminRole(AdminRole);
      setEnterpriseIdOfAdmin(AdminEnterpriseId);
    };

    fetchEnterprises();
  }, [session]);

  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setContractTypes([]);
      return;
    }

    const fetchContractTypes = async () => {
      try {
        const allContractTypes = await providers.API.getAll<ContractTypesResponseDto>(
          providers.APIUrl,
          "contract-types",
          null
        );

        if (allContractTypes && Array.isArray(allContractTypes.data)) {
          const filteredTypes = allContractTypes.data.filter(
            contractType =>
              contractType.EnterpriseId === Number(inputs.EnterpriseId)
          );
          setContractTypes(filteredTypes);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des types de contrat :", error);
      }
    };

    fetchContractTypes();
  }, [inputs.EnterpriseId]);

  // 4. Données dynamiques & statiques
  const dynamicArrayData = [
    {
      alias: "EnterpriseId",
      arrayData: getEnterprises
        .filter((item) => item.id && item.name)
        .map((item) => ({ value: item.id, title: item.name })),
    },
    {
      alias: "ContractTypeId",
      arrayData: getContractTypes
        .filter((item) => item.id && item.title)
        .map((item) => ({ value: item.id, title: item.title })),
    },
  ];

  const staticArrayData = [
    {
      alias: "",
      arrayData: [{ title: "", value: "" }],
    },
  ];

  // 5. Soumission du formulaire
  const handleSubmit = async () => {
    const requiredFields = {
      "Entreprise": inputs.EnterpriseId,
      "Date de début": inputs.startDate,
      "Date de fin": inputs.endDate,
      "Type de contrat": inputs.ContractTypeId,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return toast.info("Champs invalides", `Le champ ${key} est obligatoire`);
      }
    }

    setIsLoading(true);

    try {
      await providers.API.post(
        providers.APIUrl,
        "contracts",
        null,
        inputs
      );

      sessionStorage.removeItem("inputMemoryOfAddContractPage");
      toast.success("Succès", "Contrat créé avec succès");
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la création du contrat :", error);
      toast.error(
        "Erreur",
        error instanceof Error ? error.message : "Erreur serveur lors de la création"
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