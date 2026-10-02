"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { providers } from "@/index";
import { EnterprisesResponseDto, PostsResponseDto, Salary, SalaryResponseDto } from "@/types/global";
import { useToast } from "@/components/toast";

type InputsValue = {
  grossSalary: string | number | null;
  dailySalary: string | number | null;
  netSalary: string | number | null;
  EnterpriseId: number | null;
  PostId: number | null;
  Post: {
    title: string;
  };
  Enterprise: {
    name: string;
  };
  [key: string]: any;
};

const initialInputState: InputsValue = {
  grossSalary: null,
  dailySalary: null,
  netSalary: null,
  EnterpriseId: null,
  PostId: null,
  Post: { title: "" },
  Enterprise: { name: "" },
};

export default function useAddSalary() {
  const { data: session } = useSession();
  const toast = useToast()
  // On extrait le rôle et l'EnterpriseId de la session de façon sécurisée
  const adminRole = (session?.user as any)?.role ?? null;
  const enterpriseIdOfAdmin = (session?.user as any)?.EnterpriseId ?? null;

  // États des données
  const [getEnterprises, setEnterprises] = useState<any[]>([]);
  const [getPosts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // État du formulaire
  const [inputs, setInputs] = useState<InputsValue>(initialInputState);

  // 1. Restauration de la mémoire du formulaire depuis LocalStorage au montage
  useEffect(() => {
    const savedInputs = localStorage.getItem("inputMemoryOfAddSalaryPage");
    if (savedInputs) {
      try {
        setInputs(JSON.parse(savedInputs));
      } catch (error) {
        console.error("Erreur lors du parsing des inputs depuis le localStorage", error);
      }
    }
  }, []);

  // 2. Chargement des entreprises (dépend du rôle & id entreprise issus de la session)
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const enterprisesData = await providers.API.getAll<EnterprisesResponseDto>(
          providers.APIUrl,
          "enterprises",
          null
        );

        if (adminRole !== "Super-Admin" && enterpriseIdOfAdmin) {
          const filtered = enterprisesData.data.filter(
            (item: { id: number }) => item.id === Number(enterpriseIdOfAdmin)
          );
          setEnterprises(filtered);
        } else {
          setEnterprises(enterprisesData.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des entreprises:", error);
      }
    };

    fetchEnterprises();
  }, [adminRole, enterpriseIdOfAdmin]);

  // 3. Récupération des postes filtrés par entreprise sélectionnée
  useEffect(() => {
    if (!inputs.EnterpriseId) {
      setPosts([]);
      return;
    }

    const fetchPosts = async () => {
      try {
        const postsData = await providers.API.getAll<PostsResponseDto>(
          providers.APIUrl,
          "posts",
          null
        );
        const filteredPosts = postsData.data.filter(
          post => post.EnterpriseId === Number(inputs.EnterpriseId)
        );
        setPosts(filteredPosts);
      } catch (error) {
        console.error("Erreur lors de la récupération des postes:", error);
      }
    };

    fetchPosts();
  }, [inputs.EnterpriseId]);

  // Options dynamiques pour les champs select
  const dynamicArrayData = useMemo(
    () => [
      {
        alias: "EnterpriseId",
        arrayData: getEnterprises
          .filter((item) => item?.id && item?.name)
          .map((item) => ({ value: item.id, title: item.name })),
      },
      {
        alias: "PostId",
        arrayData: getPosts
          .filter((item) => item?.id && item?.title)
          .map((item) => ({ value: item.id, title: item.title })),
      },
    ],
    [getEnterprises, getPosts]
  );

  const staticArrayData = [
    {
      alias: "",
      arrayData: [{ title: "", value: "" }],
    },
  ];

  // Soumission du formulaire
  const handleSubmit = async () => {
    const requireFields = {
      grossSalary: inputs.grossSalary,
      dailySalary: inputs.dailySalary,
      EnterpriseId: inputs.EnterpriseId,
      PostId: inputs.PostId,
    };

    // Validation des champs requis
    for (const [key, value] of Object.entries(requireFields)) {
      if (!value) {
        return toast.info("Champs invalides", "Veuillez remplir tous les champs obligatoires");
      }
    }

    setIsLoading(true);

    try {
      await providers.API.post<SalaryResponseDto>(
        providers.APIUrl,
        "salaries",
        null,
        {
          ...inputs,
          netSalary: inputs.grossSalary,
        }
      );
      localStorage.removeItem("inputMemoryOfAddSalaryPage");
      toast.success("Félicitations", "Nouveau salaire enregistré avec succès");
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la soumission du salaire:", error);
      toast.error(
        "Erreur",
        error instanceof Error ? error.message : "Erreur au serveur lors de la connexion"
      )
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