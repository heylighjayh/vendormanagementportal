import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import type { Role } from "@/lib/portal-types";
import { getPrismaClient } from "@/lib/prisma";
import { getDashboardHref, mapPrismaRole } from "@/lib/role-utils";

const providers = [];

if (process.env["AUTH_DEV_ALLOW_EMAIL_LOGIN"] === "true") {
  providers.push(
    Credentials({
      name: "Seeded email login",
      credentials: {
        email: { label: "Email", type: "email" },
        role: { label: "Role", type: "text" },
      },
      async authorize(credentials) {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const requestedRole = String(credentials.role ?? "").trim() as Role | "";

        if (!email) {
          return null;
        }

        const prisma = getPrismaClient();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const role = mapPrismaRole(user.role);

        if (requestedRole && role !== requestedRole) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role,
        };
      },
    }),
  );
}

if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
  providers.push(
    Google({
      clientId: process.env["GOOGLE_CLIENT_ID"],
      clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
    }),
  );
}

if (
  process.env["MICROSOFT_CLIENT_ID"] &&
  process.env["MICROSOFT_CLIENT_SECRET"] &&
  process.env["MICROSOFT_TENANT_ID"]
) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env["MICROSOFT_CLIENT_ID"],
      clientSecret: process.env["MICROSOFT_CLIENT_SECRET"],
      issuer: `https://login.microsoftonline.com/${process.env["MICROSOFT_TENANT_ID"]}/v2.0`,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();

      if (!email) {
        return false;
      }

      const prisma = getPrismaClient();
      const dbUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!dbUser) {
        return false;
      }

      user.id = dbUser.id;
      user.role = mapPrismaRole(dbUser.role);
      user.name = dbUser.name ?? user.name ?? dbUser.email;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? "");
        session.user.role = (token.role as Role | undefined) ?? "vendor";
      }

      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },
});

export function getDefaultRedirectForSession(role?: Role) {
  return role ? getDashboardHref(role) : "/dashboard/vendor";
}
