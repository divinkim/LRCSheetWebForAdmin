export type AppointmentDto = {
    fullName: string,
    email?: string | null,
    phone: string,
    UserId: number | null,
    date: string,
    time?: string | null,
    reason: string,
    status: string,
    [key: string]: number | string | any
}

export type Appointment = {
    fullName: string,
    email?: string | null,
    phone: string,
    UserId: number,
    date: string,
    time?: string | null,
    status: string,
    reason: string,
    User: {
        id: number,
        lastname: string,
        firstname: string
    }

}