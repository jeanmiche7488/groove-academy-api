import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@grooveacademy.com'
  const newPassword = 'Admin123!'
  
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    })

    console.log('Mot de passe mis à jour avec succès pour:', updatedUser.email)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du mot de passe:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 