import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getPrismaClient } from "@/lib/tenant";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        slug: { label: "Restaurant Slug", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.slug || !credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const prisma = getPrismaClient(credentials.slug);

          const staff = await prisma.staffMember.findUnique({
            where: { email: credentials.email },
            include: {
              restaurant: {
                select: { id: true, name: true, slug: true },
              },
            },
          });

          if (!staff || !staff.isActive) {
            return null;
          }

          const isValid = bcrypt.compareSync(credentials.password, staff.passwordHash);
          if (!isValid) {
            return null;
          }

          return {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            restaurantId: staff.restaurant.id,
            restaurantSlug: staff.restaurant.slug,
            restaurantName: staff.restaurant.name,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.restaurantId = user.restaurantId;
        token.restaurantSlug = user.restaurantSlug;
        token.restaurantName = user.restaurantName;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.restaurantId = token.restaurantId;
      session.user.restaurantSlug = token.restaurantSlug;
      session.user.restaurantName = token.restaurantName;
      return session;
    },
  },
  pages: {
    signIn: "/dashboard/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
