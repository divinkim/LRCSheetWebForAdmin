import { providers } from "@/index";

export default function Loader({ isLoading = true }) {
    return (
        <div className={!isLoading ? "hidden" : "h-screen w-screen bg-white overflow-hidden flex justify-center items-center"}>
            <div className="w-[100px] h-[100px]">
                <img src={`${providers.APIUrl}/images/loader.gif`} alt="" className="h-full w-full object-cover" />
            </div>
        </div>
    )
}