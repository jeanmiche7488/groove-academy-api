import { Request, Response } from "express"
import { PrismaClient, PaymentStatus, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

export const statsController = {
  async getDashboardStats(req: Request, res: Response) {
    try {
      // Récupérer le nombre total d'élèves
      const totalStudents = await prisma.user.count({
        where: { role: UserRole.STUDENT }
      })

      // Récupérer le nombre total de professeurs
      const totalTeachers = await prisma.user.count({
        where: { role: UserRole.TEACHER }
      })

      // Récupérer le nombre de cours cette semaine
      const today = new Date()
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
      const endOfWeek = new Date(today.setDate(today.getDate() + 6))

      const weeklyCourses = await prisma.course.count({
        where: {
          createdAt: {
            gte: startOfWeek,
            lte: endOfWeek
          }
        }
      })

      // Récupérer les revenus du mois
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      const monthlyPayments = await prisma.payment.aggregate({
        where: {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          },
          status: PaymentStatus.PAID
        },
        _sum: {
          amount: true
        }
      })

      // Récupérer l'activité récente (combiner les données de plusieurs tables)
      const recentStudents = await prisma.user.findMany({
        where: { role: UserRole.STUDENT },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      })

      const recentTeachers = await prisma.user.findMany({
        where: { role: UserRole.TEACHER },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          createdAt: true
        }
      })

      const recentCourses = await prisma.course.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: {
          id: true,
          name: true,
          createdAt: true
        }
      })

      // Combiner toutes les activités récentes
      const recentActivity = [
        ...recentStudents.map(student => ({
          id: `student-${student.id}`,
          type: 'Nouvel élève',
          createdAt: student.createdAt,
          user: {
            firstName: student.firstName,
            lastName: student.lastName
          }
        })),
        ...recentTeachers.map(teacher => ({
          id: `teacher-${teacher.id}`,
          type: 'Nouveau professeur',
          createdAt: teacher.createdAt,
          user: {
            firstName: teacher.firstName,
            lastName: teacher.lastName
          }
        })),
        ...recentCourses.map(course => ({
          id: `course-${course.id}`,
          type: 'Nouveau cours',
          createdAt: course.createdAt,
          description: course.name
        }))
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)

      res.json({
        stats: {
          totalStudents,
          totalTeachers,
          weeklyCourses,
          monthlyRevenue: monthlyPayments._sum.amount || 0
        },
        recentActivity
      })
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  }
} 