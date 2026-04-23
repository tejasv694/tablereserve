import { getServerSession } from "next-auth";
import { adminAuthOptions } from "./adminAuth";

export async function getAdminSession() {
  const session = await getServerSession(adminAuthOptions);
  if (!session || session.user?.role !== "PLATFORM_ADMIN") {
    return null;
  }
  return session;
}
