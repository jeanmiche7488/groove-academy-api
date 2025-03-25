import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@grooveacademy.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'Groove',
        role: 'ADMIN',
        phone: '0000000000',
        address: 'Adresse administrative'
      },
    });

    console.log('Administrateur créé avec succès:', admin);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin(); 