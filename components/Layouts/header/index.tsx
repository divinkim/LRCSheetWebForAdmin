"use client";
import { SearchIcon } from "@/assets/icons";
import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { Notification } from "./notification";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import { useEffect, useState } from "react";
import { providers } from "@/index";

type User = {
  image: string | null,
  fullName: string | null
}

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();
  const [adminRole, setAdminRole] = useState("")
  const [userInfo, setUserInfo] = useState<User>({
    image: "",
    fullName: ""
  })

  useEffect(() => {
    if (typeof (window) === "undefined") return;
    (() => {
      const lastname = localStorage.getItem("lastname");
      const firstname = localStorage.getItem("firstname");
      const photo = localStorage.getItem("photo");

      setUserInfo({
        image: photo,
        fullName: String(`${lastname} ${firstname}`)
      })
    })()
  }, [])

  return (
    <header className="sticky top-0 w-screen lg:w-auto z-30 bg-gray-100 flex dark:bg-gray-900 items-center justify-between dark:border bg-white px-4 py-5 shadow-xl border-gray-800 bg-gray-900  md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden"
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link href={"/"} className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <Image
            src={"/images/logo/logo-icon.svg"}
            width={32}
            height={32}
            alt=""
            role="presentation"
          />
        </Link>
      )}

      <div className="hidden lg:block">
        {/* <h1 className="mb-0.5 text-heading-5 font-bold text-dark dark:text-white">
          Dashboard
        </h1> */}
        <div className="flex items-center">
          <img src="/images/adminProfile.png" className="w-[50px] h-[50px] object-cover rounded-full" alt="" />
          <p className="font-bold text-gray-700 dark:text-gray-300"><span className="text-[40px]"> </span> <span className="relative -top-2.5 left-4">💼 Bon service admin</span></p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        {/* <div className="relative w-full max-w-[300px]">
          <input
            type="search"
            placeholder="Search"
            className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
          />

          <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 max-[1015px]:size-5" />
        </div> */}

        <ThemeToggleSwitch />

        {/* <Notification /> */}

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
