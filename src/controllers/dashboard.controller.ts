import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      // Récupérer les statistiques
      const [
        totalStudents,
        activeCourses,
        todayReservations,
        monthlyRevenue,
        lastMonthStats,
      ] = await Promise.all([
        // Total des étudiants
        prisma.user.count({
          where: { role: "STUDENT" },
        }),
        // Cours actifs
        prisma.course.count({
          where: {
            students: {
              some: {},
            },
          },
        }),
        // Réservations du jour
        prisma.reservation.count({
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        // Revenus du mois
        prisma.payment.aggregate({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
          _sum: {
            amount: true,
          },
        }),
        // Statistiques du mois dernier
        prisma.$transaction([
          prisma.user.count({
            where: {
              role: "STUDENT",
              createdAt: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
          }),
          prisma.course.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
          }),
          prisma.reservation.count({
            where: {
              date: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
          }),
          prisma.payment.aggregate({
            where: {
              createdAt: {
                gte: new Date(new Date().setMonth(new Date().getMonth() - 1)),
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]),
      ])

      // Calculer les variations en pourcentage
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return 100
        return ((current - previous) / previous) * 100
      }

      const stats = {
        totalStudents,
        activeCourses,
        todayReservations,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        studentGrowth: calculateGrowth(totalStudents, lastMonthStats[0]),
        courseGrowth: calculateGrowth(activeCourses, lastMonthStats[1]),
        reservationGrowth: calculateGrowth(todayReservations, lastMonthStats[2]),
        revenueGrowth: calculateGrowth(
          monthlyRevenue._sum.amount || 0,
          lastMonthStats[3]._sum.amount || 0
        ),
      }

      res.json(stats)
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async getRecentActivities(req: Request, res: Response) {
    try {
      // Récupérer les activités récentes
      const [courses, reservations, payments, students] = await Promise.all([
        // Derniers cours créés
        prisma.course.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            teacher: true,
          },
        }),
        // Dernières réservations
        prisma.reservation.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            student: true,
            course: true,
          },
        }),
        // Derniers paiements
        prisma.payment.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            student: true,
            course: true,
          },
        }),
        // Derniers étudiants inscrits
        prisma.user.findMany({
          take: 5,
          where: { role: "STUDENT" },
          orderBy: { createdAt: "desc" },
        }),
      ])

      // Transformer les données en format d'activités
      const activities = [
        ...courses.map((course) => ({
          id: course.id,
          title: "Nouveau cours créé",
          description: `${course.name} par ${course.teacher.firstName} ${course.teacher.lastName}`,
          time: course.createdAt,
          type: "course" as const,
        })),
        ...reservations.map((reservation) => ({
          id: reservation.id,
          title: "Nouvelle réservation",
          description: `${reservation.course.name} - ${reservation.student.firstName} ${reservation.student.lastName}`,
          time: reservation.createdAt,
          type: "reservation" as const,
        })),
        ...payments.map((payment) => ({
          id: payment.id,
          title: "Paiement reçu",
          description: `${payment.student.firstName} ${payment.student.lastName} - ${payment.course.name}`,
          time: payment.createdAt,
          type: "payment" as const,
        })),
        ...students.map((student) => ({
          id: student.id,
          title: "Nouvel étudiant",
          description: `${student.firstName} ${student.lastName} s'est inscrit`,
          time: student.createdAt,
          type: "student" as const,
        })),
      ]

      // Trier par date et limiter à 10 activités
      const recentActivities = activities
        .sort((a, b) => b.time.getTime() - a.time.getTime())
        .slice(0, 10)
        .map((activity) => ({
          ...activity,
          time: formatTimeAgo(activity.time),
        }))

      res.json(recentActivities)
    } catch (error) {
      console.error("Erreur lors de la récupération des activités:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
}

// Fonction utilitaire pour formater le temps
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Il y a quelques secondes"
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? "s" : ""}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? "s" : ""}`
  }

  return date.toLocaleDateString("fr-FR")
} 