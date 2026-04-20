export default function SubscriptionEpiredComponent() {
    return (
        <div className="fixed w-full h-full z-50 bg-black/70 flex items-center justify-center">
            <div className="w-[90%] lg:w-[55%] xl:w-[550px] rounded-md  py-5 mx-auto bg-white">
                <div className="w-[100px] h-[100px] mx-auto my-3">
                    <img src="/images/logo/warning.webp" className="w-full h-full" alt="" />
                </div>
                <div>
                    <h1 className="text-center text-2xl font-extrabold text-gray-700">Abonnement expiré</h1>
                    <p className="text-center font-normal pt-4 text-gray-700 my-3 text-lg w-[90%] mx-auto">Votre abonnement au pack LRCSheet à expiré, veuillez relancer votre abonnement en cliquant sur le bouton ci-dessus.
                    </p>
                </div>
                <div className="w-[200px] mx-auto my-6">
                    <button type="button" className="w-full py-3.5 bg-yellow-500 text-white rounded-md">
                        <a target="_blank" href="https://www.google.com" className="w-full h-auto font-semibold">
                            Se réabonner
                        </a>
                    </button>
                </div>
            </div>
        </div>
    )
}