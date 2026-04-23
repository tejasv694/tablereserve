import { PrismaClient } from "../generated/master-prisma/index.js";

const globalForMasterPrisma = globalThis;

const masterPrisma =
  globalForMasterPrisma.__masterPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForMasterPrisma.__masterPrisma = masterPrisma;
}

export default masterPrisma;
