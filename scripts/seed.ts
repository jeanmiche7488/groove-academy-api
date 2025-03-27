import { PrismaClient, UserRole, CourseType, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Création d'un professeur
  const teacherPassword = await bcrypt.hash('Teacher123!', 10);
  const teacherUser = await prisma.user.create({
    data: {
      email: 'teacher@grooveacademy.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.TEACHER,
    },
  });

  const teacherProfile = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
    },
  });

  // Création d'un étudiant
  const studentPassword = await bcrypt.hash('Student123!', 10);
  const studentUser = await prisma.user.create({
    data: {
      email: 'student@grooveacademy.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.STUDENT,
    },
  });

  const studentProfile = await prisma.student.create({
    data: {
      userId: studentUser.id,
    },
  });

  // Création d'un cours
  const course = await prisma.course.create({
    data: {
      name: 'Guitare Débutant',
      description: 'Cours de guitare pour débutants',
      type: CourseType.COURSE,
      maxStudents: 8,
      pricePerStudent: 25.00,
      teacherId: teacherProfile.id,
    },
  });

  // Création d'une semaine d'ouverture
  const week = await prisma.week.create({
    data: {
      startDate: new Date('2024-03-25'),
      endDate: new Date('2024-03-31'),
      isActive: true,
    },
  });

  // Création du planning du cours
  const courseSchedule = await prisma.courseSchedule.create({
    data: {
      courseId: course.id,
      weekId: week.id,
      dayOfWeek: 1, // Lundi
      startTime: '14:00',
      endTime: '15:30',
    },
  });

  // Création d'une inscription
  const enrollment = await prisma.enrollment.create({
    data: {
      studentId: studentProfile.id,
      courseId: course.id,
      status: PaymentStatus.PENDING,
    },
  });

  console.log('Données de test créées avec succès !');
  console.log('Professeur:', teacherUser.email);
  console.log('Étudiant:', studentUser.email);
  console.log('Cours:', course.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 