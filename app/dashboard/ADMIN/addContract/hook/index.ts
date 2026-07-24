'use client';

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { providers } from "@/index";

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
  // 1. Récupération de la session utilisateur via useSession
  const { data: session } = useSession();

  // 2. États
  const [inputs, setInputs] = useState<InputsValue>(INITIAL_INPUTS);
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getContractTypes, setContractTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Extraction des rôles/identifiants depuis la session
  const adminRole = session?.user?.role ?? null;
  const enterpriseIdOfAdmin = session?.user?.EnterpriseId ?? null;

  // 3. Restauration du brouillon de formulaire + Récupération des Entreprises
  useEffect(() => {
    // Restauration de la mémoire de saisie du formulaire si présente
    const storedInputMemory = sessionStorage.getItem("inputMemoryOfAddContractPage");
    if (storedInputMemory) {
      try {
        setInputs(JSON.parse(storedInputMemory));
      } catch {
        setInputs(INITIAL_INPUTS);
      }
    }

    (async () => {
      const enterprises = await providers.API.getAll(
        providers.APIUrl,
        "getEnterprises",
        null
      );

      if (adminRole && adminRole !== "Super-Admin" && enterpriseIdOfAdmin) {
        const filteredEnterprises = enterprises.filter(
          (item: { id: number }) => item.id === Number(enterpriseIdOfAdmin)
        );
        setEnterprises(filteredEnterprises);
      } else {
        setEnterprises(enterprises);
      }
    })();
  }, [adminRole, enterpriseIdOfAdmin]);

  // 4. Récupération des Types de Contrat selon l'Entreprise sélectionnée
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setContractTypes([]);
      return;
    }

    (async () => {
      const allContractTypes = await providers.API.getAll(
        providers.APIUrl,
        "getContractTypes",
        null
      );
      const filteredTypes = allContractTypes.filter(
        (contractType: { EnterpriseId: number }) =>
          contractType.EnterpriseId === inputs.EnterpriseId
      );
      setContractTypes(filteredTypes);
    })();
  }, [inputs.EnterpriseId]);

  // 5. Données dynamiques & statiques
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

  // 6. Soumission du formulaire
  const handleSubmit = async () => {
    const requiredFields = {
      EnterpriseId: inputs.EnterpriseId,
      startDate: inputs.startDate,
      endDate: inputs.endDate,
      ContractTypeId: inputs.ContractTypeId,
    };

    const hasEmptyField = Object.values(requiredFields).some((value) => !value);

    if (hasEmptyField) {
      return providers.alertMessage(
        false,
        "Champs invalides",
        "Veuillez renseigner tous les champs obligatoires",
        null
      );
    }

    setIsLoading(true);

    const response = await providers.API.post(
      providers.APIUrl,
      "createContract",
      null,
      inputs
    );

    setIsLoading(false);

    if (response.status) {
      sessionStorage.removeItem("inputMemoryOfAddContractPage");
    }

    providers.alertMessage(
      response.status,
      response.title,
      response.message,
      response.status ? "/dashboard/ADMIN/addContract" : null
    );
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