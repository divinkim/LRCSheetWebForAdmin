import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { providers } from "@/index";

async function refreshAccessToken(token: any) {
    try {
        const refreshedTokens = await providers.API.post(
            providers.APIUrl,
            "refresh-token",
            null,
            { refreshToken: token.refreshToken }
        );

        return {
            ...token,
            authToken: refreshedTokens.authToken,
            refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
            //expiration dans 10 minutes (en ms)
            authTokenExpiresIn: Date.now() + 60 * 60 * 1000,
            error: null, // Reset en cas de succès
        };
    } catch (error) {
        console.error("Erreur Refresh Token:", error);
        return {
            ...token,
            error: "RefreshAccessTokenError",
        };
    }
}

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const data = await providers.API.post(
                        "https://vps118934.serveur-vps.net:4001",
                        "loginFromAdmin",
                        null,
                        {
                            email: credentials.email,
                            password: credentials.password,
                        }
                    );
                    console.log(data)
                    return {
                        id: data.user.id.toString(),
                        firstname: data.user.firstname,
                        lastname: data.user.lastname,
                        email: data.user.email,
                        image: data.user.image,
                        authToken: data.user.authToken,
                        refreshToken: data.user.refreshToken,
                        adminRole: data.user.adminRole,
                        EnterpriseId: data.user.EnterpriseId,
                        adminService: data.user.adminService,
                        MainEnterpriseId: data.user.MainEnterpriseId
                    };
                } catch (error) {
                    throw new Error(
                        error instanceof Error ? error.message : "Erreur inconnue"
                    );
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }: any) {
            //Première connexion : enregistrement et initialisation de l'expiration
            if (user) {
                return {
                    ...token,
                    id: user.id,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    authToken: user.authToken,
                    refreshToken: user.refreshToken,
                    adminRole: user.adminRole,
                    EnterpriseId: user.EnterpriseId,
                    MainEnterpriseId: user.MainEnterpriseId,
                    adminService: user.adminService,
                    //DÉFINITION DE L'EXPIRATION : 10 min à partir de maintenant
                    authTokenExpiresIn: Date.now() + 60 * 60 * 1000,
                };
            }

            if (Date.now() < (token.authTokenExpiresIn as number)) {
                return token;
            }
            return await refreshAccessToken(token);
        },

        async session({ session, token }: any) {
            if (token) {
                session.user = {
                    ...session.user,
                    id: token.id,
                    firstname: token.firstname,
                    lastname: token.lastname,
                    authToken: token.authToken,
                    refreshToken: token.refreshToken,
                    adminRole: token.adminRole,
                    EnterpriseId: token.EnterpriseId,
                    adminService: token.adminService,
                };
                //Erreur de refresh à la session pour que le client sache quand déconnecter
                session.error = token.error;
            }
            return session;
        },
    },

    pages: {
        signIn: "/",
    },

    session: {
        strategy: "jwt" as const,
        maxAge: 7 * 24 * 60 * 60, //7 jours (durée égale au refreshToken backend)
    },

    secret: process.env.NEXTAUTH_SECRET,
};
