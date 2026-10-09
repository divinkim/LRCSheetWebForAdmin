import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import "@/lib/fontawesome";
import ClientLayout from "./clientLayout";
import { ThemeProvider } from "next-themes";
import { ToastProvider } from "@/components/toast";
import SessionProvider from "@/components/providers";
import ChatSocketProvider from "@/components/call/ChatSocketProvider";
import CallProvider from "@/components/call/CallProvider";
import CallModal from "@/components/call/CallModal";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "LRCSheet",
  description: "Tableau de bord pour les administrateurs web LRCSheet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans tracking-tight w-full overflow-x-hidden bg-background text-foreground dark:bg-darkBackground dark:text-darkForeground">
        <ThemeProvider attribute="class" defaultTheme="light">
          <ToastProvider>
            <NextTopLoader color="#5750F1" showSpinner={false} />
            <SessionProvider>
              {/* Socket + appels globaux : le modal d'appel s'affiche sur toutes les pages */}
              <ChatSocketProvider>
                <CallProvider>
                  <ClientLayout>{children}</ClientLayout>
                  {/* UI des appels (entrant / sortant), doit être DANS CallProvider */}
                  <CallModal />
                </CallProvider>
              </ChatSocketProvider>
            </SessionProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
