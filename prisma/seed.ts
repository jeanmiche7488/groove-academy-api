import { PrismaClient, UserRole, PaymentStatus } from '@prisma/client'
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

  // Créer des professeurs
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'jean.dupont@grooveacademy.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Jean',
        lastName: 'Dupont',
        role: UserRole.TEACHER,
        teacherProfile: {
          create: {}
        }
      },
      include: {
        teacherProfile: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'marie.martin@grooveacademy.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Marie',
        lastName: 'Martin',
        role: UserRole.TEACHER,
        teacherProfile: {
          create: {}
        }
      },
      include: {
        teacherProfile: true
      }
    })
  ])

  // Créer des élèves
  const students = await Promise.all([
    prisma.user.create({
      data: {
        email: 'pierre.durand@grooveacademy.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Pierre',
        lastName: 'Durand',
        role: UserRole.STUDENT,
        studentProfile: {
          create: {}
        }
      },
      include: {
        studentProfile: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'sophie.bernard@grooveacademy.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Sophie',
        lastName: 'Bernard',
        role: UserRole.STUDENT,
        studentProfile: {
          create: {}
        }
      },
      include: {
        studentProfile: true
      }
    }),
    prisma.user.create({
      data: {
        email: 'lucas.petit@grooveacademy.com',
        password: await bcrypt.hash('password123', 10),
        firstName: 'Lucas',
        lastName: 'Petit',
        role: UserRole.STUDENT,
        studentProfile: {
          create: {}
        }
      },
      include: {
        studentProfile: true
      }
    })
  ])

  // Créer des cours
  const courses = await Promise.all([
    prisma.course.create({
      data: {
        name: 'Cours de Piano',
        description: 'Cours de piano pour débutants',
        type: 'COURSE',
        maxStudents: 1,
        pricePerStudent: 45,
        teacherId: teachers[0].teacherProfile!.id,
      }
    }),
    prisma.course.create({
      data: {
        name: 'Cours de Chant',
        description: 'Cours de chant pour tous niveaux',
        type: 'COURSE',
        maxStudents: 1,
        pricePerStudent: 37.5,
        teacherId: teachers[1].teacherProfile!.id,
      }
    }),
    prisma.course.create({
      data: {
        name: 'Cours de Guitare',
        description: 'Cours de guitare pour intermédiaires',
        type: 'COURSE',
        maxStudents: 1,
        pricePerStudent: 45,
        teacherId: teachers[0].teacherProfile!.id,
      }
    })
  ])

  // Créer des inscriptions
  const enrollments = await Promise.all([
    prisma.enrollment.create({
      data: {
        studentId: students[0].studentProfile!.id,
        courseId: courses[0].id,
        status: PaymentStatus.PAID,
      }
    }),
    prisma.enrollment.create({
      data: {
        studentId: students[1].studentProfile!.id,
        courseId: courses[1].id,
        status: PaymentStatus.PAID,
      }
    }),
    prisma.enrollment.create({
      data: {
        studentId: students[2].studentProfile!.id,
        courseId: courses[2].id,
        status: PaymentStatus.PAID,
      }
    })
  ])

  console.log('Données de test créées avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 