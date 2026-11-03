import { providers } from "@/index";
import { isResolvedLazyResult } from "next/dist/server/lib/lazy-result";
import { useEffect, useState } from "react";
import { useToast } from "@/components/toast";
import { PresencesListHookModal } from "../../hook";
import { useSession } from "next-auth/react";
import { AttendanceListDto, AttendancesListDto, User, UsersResponseDto } from "@/types/global";

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
    const { setPresencesListCloned, presencesListCloned, setPresencesList } = PresencesListHookModal()
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const { data: session } = useSession();
    useEffect(() => {
        (async () => {
            const EnterpriseId = Number((session?.user as any)?.EnterpriseId);
            const getUsers = await providers.API.getAll<UsersResponseDto>(providers.APIUrl, "users", null);
            const getUsersByEnterprises = getUsers.data.filter(user => user.Enterprise.MainEnterpriseId === EnterpriseId);
            setUsersArray(getUsersByEnterprises);
            setUsersArrayCloned(getUsersByEnterprises);
        })();
    }, []);

    const filterUserByName = (value: string) => {
        if (!value) return;
        const convertValue = value.toLowerCase();
        const getUser = usersArrayCloned.filter(user => {
            const lastname = user.lastname.toLowerCase();
            const firstname = user.firstname.toLowerCase();
            return (lastname.includes(convertValue)
                || firstname.includes(convertValue)
            );
        });
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
                    "Veuillez sélectionner au moins un utilisateur et renseigner une heure d'arrivée"
                )
                return;
            }
            setIsLoading(true);
            const res = await providers.API.post<AttendancesListDto>(providers.APIUrl,
                "attendances/from-admin",
                null,
                inputs,
            );
            const title = "Bravo";
            const message = "Horaires ajoutées avec succès";
            toast.success(title, message);
            setInputs({
                usersId: [],
                arrivalTime: "",
                departureTime: "",
                salariesId: [],
                enterprisesId: [],
                planningsId: [],
                date: "",
            });
            localStorage.setItem("presencesData", JSON.stringify(res.data.filter(item =>
                item.mounth === new Date().getMonth()))
            )
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