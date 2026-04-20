"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import useAuth from "./auth";
import { ClipLoader } from "react-spinners";

export default function Home() {
  const { showPassword, setShowPassword, showSpinner, inputs, setInputs, authFunction, message } = useAuth()
  return (
    <>
      {/* <Loader isLoading={loader} /> */}
      <div className="bg-white dark:bg-gray-800 flex overflow-hidden justify-center lg:justify-normal items-center w-screen h-screen">
        <div className="flex w-full h-full">
          <div className="hidden lg:flex lg:w-full bg-gradient-to-tr from-blue-800 to-purple-700 justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative z-10 px-10 text-center">
              <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl">
                <img src="/images/logo.png" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">LRCSheet Web Admin</h1>
              <p className="text-white/80 text-lg mb-8">Assurez la gestion des données utilisateurs en toute sécurité et confiance!</p>
              <div className="flex justify-center space-x-4">
                <div className="w-3 h-3 rounded-full bg-white/30"></div>
                <div className="w-3 h-3 rounded-full bg-white"></div>
                <div className="w-3 h-3 rounded-full bg-white/30"></div>
              </div>
            </div>

            <div className="absolute -bottom-32 -left-40 w-80 h-80 border-4 border-white/30 rounded-full"></div>
            <div className="absolute -bottom-40 -left-20 w-80 h-80 border-4 border-white/30 rounded-full"></div>
            <div className="absolute top-0 -right-20 w-80 h-80 border-4 border-white/30 rounded-full"></div>
          </div>
          <div className="w-full h-full flex items-center justify-center bg-white bg-no-repeat bg-cover bg-center">
            <div className="w-full h-full">
              <div className={`transition-all duration-700 ${message ? "w-full py-2 bg-red-400" : "opacity-0"}`}>
                <p className="text-center font-semibold text-white">{message}</p>
              </div>
              <div className="flex w-full h-full items-center justify-center">
                <div className="w-[90%] sm:w-[80%] lg:w-3/4 xl:w-[60%]">
                  <div className="w-full  border border-gray-200 py-10 px-6 rounded-xl shadow-xl">
                    <div className="text-center lg:text-left">
                      <h2 className="text-2xl w-[300px] lg:w-[350px] relative right-1 lg:right-0 mx-auto leading-8 font-extrabold text-blue-500 mb-2 text-center">Authentification à LRCSheet Web Admin!</h2>
                    </div>

                    <form className="space-y-6 mt-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-600">E-mail</label>
                        <input onChange={(input) => {
                          setInputs({
                            ...inputs,
                            email: input.target.value
                          })
                        }} type="email" id="email" name="email" className="mt-1 block w-full px-3 py-3 border  border-gray-300 dark:bg-transparent text-gray-600 placeholder-gray-400 dark:text-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="email@gmail.com" />
                      </div>

                      <div className="relative">
                        <label className="block text-sm  font-bold text-gray-600">Mot de passe</label>
                        <input onChange={(input) => {
                          setInputs({
                            ...inputs,
                            password: input.target.value
                          })
                        }} id="password" type={showPassword ? "text" : "password"} name="password" className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm text-gray-600 focus:outline-none dark:bg-transparent focus:ring-blue-500 focus:border-blue-500" placeholder="Votre mot de passe" />
                        <div onClick={() => {
                          setShowPassword(!showPassword)
                        }} className="absolute right-4 top-[38px]">
                          <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} className="text-gray-600" />
                        </div>
                      </div>

                      <div className="relative top-1">
                        <button onClick={() => {
                          authFunction()
                        }} type="button" className="w-full flex justify-center py-3.5 px-4 border ease duration-500 border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 font-semibold focus:ring-blue-500">
                          {showSpinner ? <ClipLoader color='#fff' size={16} /> : "Connexion"}
                        </button>
                      </div>
                    </form>

                    <div className="mt-6">

                    </div>

                    <p className="mt-8 text-center text-sm text-gray-600">
                      Mo de passe oublié ?
                      <a href="#" className="font-medium text-blue-600 hover:text-blue-500"> réinitialisez votre mot de passe</a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>

  );
}
