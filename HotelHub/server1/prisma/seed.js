import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);

  await prisma.user.upsert({
    where: { email: "admin@hotelhub.local" },
    update: {},
    create: {
      name: "HotelHub Admin",
      email: "admin@hotelhub.local",
      passwordHash: adminHash,
      role: "ADMIN"
    }
  });

  await prisma.user.upsert({
    where: { email: "user@hotelhub.local" },
    update: {},
    create: {
      name: "Demo Traveler",
      email: "user@hotelhub.local",
      passwordHash: userHash,
      role: "USER"
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
