import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  // 1. Pour la variable 'user' dans authorize() et jwt()
  interface User {
    id: string;
    firstname?: string;
    lastname?: string;
    authToken?: string;
    refreshToken?: string;
    adminRole?: string;
    EnterpriseId?: number | string;
    adminService?: string;
  }

  // 2. Pour 'session.user' dans useSession() et getServerSession()
  interface Session {
    user: {
      id: string;
      firstname?: string;
      lastname?: string;
      authToken?: string;
      refreshToken?: string;
      adminRole?: string;
      EnterpriseId?: number | string;
      adminService?: string;
    } & DefaultSession["user"];
    error?: string;
  }
}

declare module "next-auth/jwt" {
  // 3. Pour la variable 'token' dans jwt() et session()
  interface JWT {
    id?: string;
    firstname?: string;
    lastname?: string;
    authToken?: string;
    refreshToken?: string;
    adminRole?: string;
    EnterpriseId?: number | string;
    adminService?: string;
    authTokenExpiresIn?: number;
    error?: string;
  }
}