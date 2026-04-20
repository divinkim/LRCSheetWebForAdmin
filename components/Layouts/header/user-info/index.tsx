"use client";
import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LogOutIcon, SettingsIcon, UserIcon } from "./icons";
import Swal from "sweetalert2";
export function UserInfo() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle  outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-3">
          {/* <Image
            src={USER.img}
            className="size-12"
            alt={`Avatar of ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          /> */}
          <figcaption className="flex items-center gap-1 font-medium text-dark dark:text-dark-6 ">
            {/* <span>{USER.name}</span> */}

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "rotate-180 transition-transform text-gray-600",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className=""
        align={undefined}
      >
        {/* <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-5 py-3.5">
          <Image
            src={USER.img}
            className="size-12"
            alt={`Avatar for ${USER.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-1 text-base font-medium">
            <div className="mb-2 leading-none text-dark dark:text-white">
              {USER.name}
            </div>

            <div className="leading-none text-gray-6">{USER.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#E8E8E8] dark:border-dark-3" />

        <div className="p-2 text-base text-[#4B5563] dark:text-dark-6 [&>*]:cursor-pointer">
          <Link
            href={"/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />

            <span className="mr-auto text-base font-medium">View profile</span>
          </Link>

          <Link
            href={"/pages/settings"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />

            <span className="mr-auto text-base font-medium">
              Account Settings
            </span>
          </Link>
        </div>

        <hr className="border-[#E8E8E8] dark:border-dark-3" /> */}

        <div className="p-2 bg-white dark:bg-gray-900 border dark:border-gray-800 border-gray-400 shadow-md relative right-44 ease duration-500 rounded-md top-5 w-[200px] text-base text-[#4B5563] dark:text-dark-6">
          <button
            className="flex w-full items-center  gap-2.5 rounded-lg px-2.5 py-[9px] hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
            onClick={() => {
              Swal.fire({
                icon: "warning",
                title: "Attention!",
                text:"voulez-vous vous déconnecter ?",
                confirmButtonText:"OUI",
                cancelButtonText:"NON",
                confirmButtonColor:"#ef4444",
                cancelButtonColor:"#22c55e",
                showCancelButton: true
              }).then((confirm) => {
                if (confirm.isConfirmed) {
                  localStorage.clear();
                  window.location.href = "/"
                }
              })
            }}
          >

            <span className="text-base font-medium">Se déconnecter</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
