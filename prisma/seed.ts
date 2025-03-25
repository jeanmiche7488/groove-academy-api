import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Créer l'utilisateur admin
  const hashedPassword = await bcrypt.hash('Admin123!', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@grooveacademy.com' },
    update: {},
    create: {
      email: 'admin@grooveacademy.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'System',
      role: UserRole.ADMIN,
    },
  })

  console.log({ admin })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 