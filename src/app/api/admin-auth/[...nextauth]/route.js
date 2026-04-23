import NextAuth from "next-auth";
import { adminAuthOptions } from "@/lib/adminAuth";

const handler = NextAuth(adminAuthOptions);

export { handler as GET, handler as POST };
