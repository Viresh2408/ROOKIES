import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";



const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  console.log("createPrismaClient: Using URL:", url ? url.replace(/:[^@:]*@/, ":****@") : "undefined");


  if (!url) {
    throw new Error("DATABASE_URL is not set. It must point to the Supabase pooler (port 6543).");
  }

  if (!url.includes(".pooler.supabase.com") || !url.includes(":6543")) {
    throw new Error(
      "DATABASE_URL must use the Supabase connection pooler (host *.pooler.supabase.com on port 6543)."
    );
  }




  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}


console.log("Initializing Prisma with Pool adapter...");
export const prisma = createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

