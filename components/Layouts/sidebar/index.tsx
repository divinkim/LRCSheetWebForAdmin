"use client";
// import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown, faChevronUp, faUser, faUserGroup, faBell, faPaperPlane, faList, faFileAlt, faShieldAlt,
  faUserClock, faUsers, faUserPlus, faClipboardList,
  faClipboardCheck, faCalendarCheck, faUserShield, faFileLines, faCheckCircle, faFileContract, faSuitcaseRolling,
  faCalendarDay, faUmbrellaBeach, faFileSignature, faIdBadge, faBuilding, faChartLine, faCreditCard,
  faMoneyBill1Wave,
  faFileInvoiceDollar,
  faBuildingCircleCheck,
  faBuildingColumns,
  faFileInvoice,
  faFileCircleCheck,
  faMoneyCheckDollar,
  faReceipt,
  faBalanceScale,
  faCalendarPlus,
  faGlobe,
  faCity,
  faHouseChimney
} from "@fortawesome/free-solid-svg-icons";
import { title } from "process";
import { icon } from "@fortawesome/fontawesome-svg-core";
import { getFirebaseMessaging } from "@/firebase/firebaseConfig";
import { getToken, onMessage } from "firebase/messaging";
import SidebarHook from "./hook";
import { providers } from "@/index";

type AdminNotification = {
  path: string;
  adminSectionIndex: string,
  adminPageIndex: string,
};

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [toggleAsideSections, setToggleAsideSections] = useState<number[]>([]);
  const messaging = getFirebaseMessaging();
  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));

    // Uncomment the following line to enable multiple expanded items
    // setExpandedItems((prev) =>
    //   prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    // );
  };

  const { ItemAside, getPageNotificationsCount, getSectionNotificationsCount, storedNotificationsArray, setStoredNotificationsArray } = SidebarHook();

  useEffect(() => {
    (async () => {
      if (typeof (window) === "undefined") return;
      const id = localStorage.getItem("id");
      const adminRole = localStorage.getItem("adminRole");
      const EnterpriseId = localStorage.getItem("EnterpriseId");
      const adminService = localStorage.getItem("adminService");
      const adminFcmToken = localStorage.getItem("adminFcmToken");

      const datas = {
        fcmToken: adminFcmToken,
        id,
        adminRole,
        adminEnterpriseId: EnterpriseId,
        adminService
      }
      // Mise à jour du token de l'administrateur
      const updateFcmTokenAdmin = await providers.API.post(providers.APIUrl, "sendFcmToken", null, datas);
      console.log("le token admin", updateFcmTokenAdmin.message);

    })()
  }, []);

  useEffect(() => {
    (() => {
      if (isMobile) setIsOpen(false);
    })()
  }, [isMobile])

  console.log(isMobile)

  useEffect(() => {
    (async () => {
      const id = localStorage.getItem("id");
      const adminRole = localStorage.getItem("adminRole");
      const EnterpriseId = localStorage.getItem("EnterpriseId");
      const adminService = localStorage.getItem("adminService");
      const adminFcmToken = localStorage.getItem("adminFcmToken");

      const datas = {
        fcmToken: adminFcmToken,
        id,
        adminRole,
        adminEnterpriseId: EnterpriseId,
        adminService
      }
      // Mise à jour du token de l'administrateur
      const updateFcmTokenAdmin = await providers.API.post(providers.APIUrl, "sendFcmToken", null, datas);
      console.log("le token admin", updateFcmTokenAdmin.message);

    })()
  }, []);
  //Ecoute des notifications entrantes

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            if (!expandedItems.includes(item.title)) {
              toggleExpanded(item.title);
            }

            // Break the loop
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "w-[290px] overflow-hidden bg-gray-900  transition-[width] duration-200 ease-linear dark:border-gray-900",
          isMobile ? "fixed bottom-0 top-0 z-50" : "top-0 h-screen sticky",
          isOpen ? "w-[290px]" : "hidden",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex h-full flex-col py-10 pl-[14px] pr-[7px]">
          {/* Navigation */}
          <div className="custom-scrollbar  flex-1 overflow-y-auto pr-3">

            <div className="w-[100px] h-[100px] mx-auto mb-5">
              <img src="/images/logo.png" alt="" className='w-full h-full object-cover' />
            </div>
            <Link onClick={() => {
              if (isMobile) setIsOpen(false);
            }} href="/home" className="font-bold hover:text-gray-400 text-gray-300 ease duration-500">
              🏠 ACCUEIL
            </Link>
            <h1 className="font-bold text-[17px] mt-5 text-gray-300">Menu général</h1>
            <div className="mt-5">
              {
                ItemAside.map((aside, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 relative">
                    <div onClick={() => {
                      setToggleAsideSections(
                        toggleAsideSections.includes(sectionIndex) ?
                          toggleAsideSections.filter(item => item !== sectionIndex)
                          : [...toggleAsideSections, sectionIndex]
                      )
                    }} className="transition-all duration-1000 ease-in-out flex cursor-pointer p-2 bg-gray-800 relative z-20 hover:bg-gray-800/90 ease  text-gray-300 flex-row items-center justify-between">
                      <div>
                        <h3 className="font-bold">{aside.title ?? ""} <span className='relative left-2 text-white rounded-full px-[6px]'>
                        </span>
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2 flex-row">
                        <div className={getSectionNotificationsCount(sectionIndex) > 0 ? "bg-red-500 px-[8.5px] text-white rounded-full" : "hidden"}>
                          {getSectionNotificationsCount(sectionIndex)}
                        </div>
                        <div>
                          <FontAwesomeIcon icon={toggleAsideSections.includes(sectionIndex) ? faChevronUp : faChevronDown} className="" />
                        </div>
                      </div>
                    </div>

                    <div className={`transition-all duration-1000 ease-in-out space-y-2 pl-8 pt-4, ${toggleAsideSections.includes(sectionIndex) ? "opacity-1" : "opacity-0 absolute z-0"}`}>
                      {aside.ItemLists.map((list, pageIndex) => (
                        <Link key={pageIndex} onClick={() => {
                          const deleteNotificationCount = storedNotificationsArray.filter(item => item.adminPageIndex !== pageIndex.toString() && item.adminSectionIndex !== sectionIndex.toString());
                          setStoredNotificationsArray(deleteNotificationCount);
                          if (isMobile) setIsOpen(false);
                          localStorage.setItem("storedNotificationsArray", JSON.stringify(deleteNotificationCount))
                        }} href={list.href ?? "/"} className="flex flex-row space-x-3 mt-3 items-center">
                          <div className="">
                            <li className="hover:text-orange-400/90 ease duration-500 pb-2 text-gray-300">
                              <FontAwesomeIcon icon={list.icon} /> <span className='relativetext-gray-300'>{list.title}</span>
                            </li>
                          </div>
                          <div className={storedNotificationsArray.find(item => Number(item.adminPageIndex) === pageIndex && Number(item.adminSectionIndex) === sectionIndex) && getPageNotificationsCount(pageIndex) > 0 ? "bg-red-500 relative -top-1 px-[8.5px] text-white rounded-full" : "hidden"}>
                            {getPageNotificationsCount(pageIndex)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
