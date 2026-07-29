import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;

        //Si une erreur de Refresh Token s'est produite (refresh expiré ou invalide côté backend)
        if (token?.error === "RefreshAccessTokenError") {
            // Redirection forcée vers la page de login avec nettoyage
            const loginUrl = new URL("/", req.url);
            loginUrl.searchParams.set("error", "SessionExpired");
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    },
    {
        callbacks: {
            // La fonction authorized détermine SI l'accès est autorisé
            authorized: ({ token }) => {
                // S'il n'y a pas de token du tout, ou s'il y a une erreur de refresh, accès refusé (retourne false)
                if (!token || token.error === "RefreshAccessTokenError") {
                    return false;
                }
                return true;
            },
        },
        pages: {
            // Indique où rediriger si authorized() renvoie false
            signIn: "/",
        },
    }
);

//Configuration du Matcher pour cibler TOUTES les routes du Dashboard
export const config = {
    matcher: [
        "/home",
        "/dashboard/:path*",
    ],
};