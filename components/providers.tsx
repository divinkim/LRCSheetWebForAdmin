"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      // Rafraîchit la session en arrière-plan toutes les 4 minutes (240s)
      refetchInterval={4 * 60}
      //Force la vérification quand l'utilisateur change d'onglet et revient
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}