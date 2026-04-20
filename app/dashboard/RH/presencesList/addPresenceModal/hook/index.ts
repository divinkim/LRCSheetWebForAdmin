import { providers } from "@/index";
import { isResolvedLazyResult } from "next/dist/server/lib/lazy-result";
import { useEffect, useState } from "react";

type User = {
    lastname: string,
    firstname: string,
    id: number,
    SalaryId: number,
    EnterpriseId: number,
    photo: string | null,
    adminService: null,
}

type Inputs = {
    arrivalTime: string,
    usersId: number[],
    enterprisesId: number[],
    salariesId: any[],
    createdAt: string,
}

export default function useAddPresenceModal() {
    const [usersArray, setUsersArray] = useState<User[]>([]);
    const [usersArrayCloned, setUsersArrayCloned] = useState<User[]>([]);
    const [inputs, setInputs] = useState<Inputs>({
        arrivalTime: "",
        usersId: [],
        enterprisesId: [],
        salariesId: [],
        createdAt: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        (async () => {
            const EnterpriseId = localStorage.getItem("EnterpriseId");
            const getUsers = await providers.API.getAll(providers.APIUrl, "getUsers", null);

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

    const onCheckBtnEvent = (UserId: number, EnterpriseId: number, SalaryId: number) => {
        const checkInUsersIdArray = inputs.usersId.includes(UserId) ?
            inputs.usersId.filter(item => item !== UserId)
            : [...inputs.usersId, UserId];

        const checkInEnterprisesIdArray = inputs.enterprisesId.includes(EnterpriseId) ?
            inputs.enterprisesId.filter(item => item !== EnterpriseId)
            : [...inputs.enterprisesId, EnterpriseId];


        const checkInSalariesIdArray = inputs.salariesId.includes(SalaryId) ?
            inputs.salariesId.filter(item => item !== SalaryId)
            : [...inputs.salariesId, SalaryId];

        setInputs({
            ...inputs,
            usersId: checkInUsersIdArray,
            enterprisesId: checkInEnterprisesIdArray,
            salariesId: checkInSalariesIdArray,
        })
    }

    const selectAllProfile = () => {
        const getAllUsersId = usersArray.filter(user => !user.adminService).map(user => user.id)
        const getAllEnterprisesId = usersArray.filter(user => !user.adminService).map(user => user.EnterpriseId)
        const getAllSalariesId = usersArray.filter(user => !user.adminService).map(user => user.SalaryId);

        setInputs({
            ...inputs,
            usersId: getAllUsersId,
            salariesId: getAllSalariesId,
            enterprisesId: getAllEnterprisesId
        })
    }

    const deselectAllProfile = () => {
        setInputs({
            ...inputs,
            usersId: [],
            salariesId: [],
            enterprisesId:[]
        })
    }

    const handleSubmit = async () => {
        setIsLoading(true);
    
        if (!inputs.arrivalTime || inputs.usersId.length < 0) {
            setTimeout(() => {
                setIsLoading(false);
                providers.alertMessage(false, "Champs invalides", "Veuillez sélectionner au moins un utilisateur et une heure d'arrivée", null);
            }, 1000);
            return;
        }

        const response = await providers.API.post(providers.APIUrl, "addAttendanceFromAdmin", null, inputs);
        if (response.status) {
            setIsLoading(false);
            setInputs({
                arrivalTime: "",
                usersId: [],
                enterprisesId: [],
                salariesId: [],
                createdAt: ""
            })
            providers.alertMessage(response.status, response.title, response.message, "/dashboard/RH/presencesList");
            return;
        }

        providers.alertMessage(response.status, response.title, response.message, null);
        setIsLoading(false);
    }

    return { usersArray, setUsersArray, usersArrayCloned, filterUserByName, onCheckBtnEvent, handleSubmit, isLoading, setInputs, inputs, selectAllProfile, deselectAllProfile }
}