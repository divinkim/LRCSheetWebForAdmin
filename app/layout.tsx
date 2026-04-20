
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import "@/lib/fontawesome";
import ClientLayout from "./clientLayout";
import { ThemeProvider } from "next-themes";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "LRCSheetWebClient",
  description: "Tableau de bord pour les utilisateur web LRCSheet",
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
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <ClientLayout>
            {children}
          </ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}