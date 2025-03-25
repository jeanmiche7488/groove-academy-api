import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const email = "admin@grooveacademy.com"
    const password = "Admin123!"
    const hashedPassword = await bcrypt.hash(password, 10)

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: "Admin",
        lastName: "System",
        role: "ADMIN",
      },
    })

    console.log("Administrateur créé avec succès:", admin)
  } catch (error) {
    console.error("Erreur lors de la création de l'administrateur:", error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 