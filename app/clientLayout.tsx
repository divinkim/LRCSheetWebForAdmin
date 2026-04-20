"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Layouts/sidebar";
import { Header } from "@/components/Layouts/header";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideLayout = pathname === "/";

  return (
    <SidebarProvider>
      {hideLayout ? (
        children
      ) : (
        <div className="flex flex-row">
          <Sidebar />
          <div className="flex-1">
            <Header />
            <div className="w-screen lg:w-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}