import { providers } from "@/index";
import { isResolvedLazyResult } from "next/dist/server/lib/lazy-result";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { PresencesListHookModal } from "../../hook";
import { useSession } from "next-auth/react";
type User = {
    lastname: string,
    firstname: string,
    id: number,
    SalaryId: number,
    EnterpriseId: number,
    photo: string | null,
    adminService: null,
    PlanningId: any
}

type Inputs = {
    arrivalTime: string,
    departureTime: string,
    usersId: number[],
    enterprisesId: number[],
    planningsId: any[],
    salariesId: any[],
    date: string,
}

export default function useAddPresenceModal() {
    const [usersArray, setUsersArray] = useState<User[]>([]);
    const [usersArrayCloned, setUsersArrayCloned] = useState<User[]>([]);
    const [inputs, setInputs] = useState<Inputs>({
        arrivalTime: "",
        departureTime: "",
        usersId: [],
        planningsId: [],
        enterprisesId: [],
        salariesId: [],
        date: ""
    });
    const { setPresencesListCloned, setPresencesList } = PresencesListHookModal()
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const { data: session } = useSession();
    useEffect(() => {
        (async () => {
            const EnterpriseId = (session?.user as any)?.EnterpriseId;
            const getUsers = await providers.API.getAll("https://vps118934.serveur-vps.net:4001", "getUsers", null);

            if (Number(EnterpriseId) === 1) {
                const getUsersByEnterprises = getUsers.filter((user: { EnterpriseId: number }) => [1, 2, 3, 4, null].includes(user.EnterpriseId));
                setUsersArray(getUsersByEnterprises);
                setUsersArrayCloned(getUsersByEnterprises);
            } else {
                const getUsersByEnterprises = getUsers.filter((user: { EnterpriseId: number }) => user.EnterpriseId === Number(EnterpriseId));
                setUsersArray(getUsersByEnterprises);
                setUsersArrayCloned(getUsersByEnterprises);
            }
        })();
    }, []);

    const filterUserByName = (value: string) => {
        const getUser = usersArrayCloned.filter(user => user.firstname.toLowerCase().includes(value.toLowerCase()) || user.lastname.toLowerCase().includes(value.toLowerCase()));
        setUsersArray(getUser);
    }

    function includesValue(array: number[], value: number) {
        const result = array.includes(value) ? array.filter(item => item !== value) : [...array, value];
        return result;
    }

    const onCheckBtnEvent = (UserId: number, EnterpriseId: number, SalaryId: number, PlanningId: number) => {
        const checkInUsersIdArray = includesValue(inputs.usersId, UserId)

        const checkInEnterprisesIdArray = [...inputs.enterprisesId, EnterpriseId];

        const checkInSalariesIdArray = [...inputs.salariesId, SalaryId];

        const checkInPlanningsIdArray = [...inputs.planningsId, PlanningId];

        setInputs({
            ...inputs,
            usersId: checkInUsersIdArray,
            enterprisesId: checkInEnterprisesIdArray,
            salariesId: checkInSalariesIdArray,
            planningsId: checkInPlanningsIdArray
        })
    }

    const selectAllProfile = () => {
        const getAllUsersId = usersArray.filter(user => !user.adminService).map(user => user.id)
        const getAllEnterprisesId = usersArray.filter(user => !user.adminService).map(user => user.EnterpriseId)
        const getAllSalariesId = usersArray.filter(user => !user.adminService).map(user => user.SalaryId);
        const getAllPlanningsId = usersArray.filter(user => !user.adminService).map(user => user.PlanningId);

        setInputs({
            ...inputs,
            usersId: getAllUsersId,
            salariesId: getAllSalariesId,
            enterprisesId: getAllEnterprisesId,
            planningsId: getAllPlanningsId
        })
    }

    const deselectAllProfile = () => {
        setInputs({
            ...inputs,
            usersId: [],
            salariesId: [],
            enterprisesId: [],
            planningsId: []
        })
    }

    const handleSubmit = async () => {
        try {
            if (!inputs.arrivalTime || inputs.usersId.length < 0) {
                toast.error("Champs invalides",
                    "Veuillez sélectionner au moins un utilisateur et une heure d'arrivée"
                )
                return;
            }
            setIsLoading(true);
            await providers.API.post(
                "https://vps118934.serveur-vps.net:4001",
                "postAttendancesFromAdmin", null,
                inputs
            );
            toast.success(
                "Bravo",
                "Horaires enregistrées avec succès"
            );
           
            setInputs({
                arrivalTime: "",
                departureTime: "",
                usersId: [],
                planningsId: [],
                enterprisesId: [],
                salariesId: [],
                date: ""
            })
        } catch (error) {
            console.log(error)
            toast.error("Erreur",
                error instanceof Error
                    ? error.message :
                    "Erreur inconnue"
            );

        } finally {
            setIsLoading(false)
        }
    }

    return {
        usersArray,
        setUsersArray,
        usersArrayCloned,
        filterUserByName,
        onCheckBtnEvent,
        handleSubmit,
        isLoading,
        setInputs,
        inputs,
        selectAllProfile,
        deselectAllProfile
    }
}