import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

const replacementSchema = z.object({
  originalTeacherId: z.string().uuid(),
  replacementTeacherId: z.string().uuid(),
  courseId: z.string().uuid(),
  date: z.string().datetime(),
  notes: z.string().optional(),
})

export const replacementController = {
  // Créer un remplacement
  async create(req: Request, res: Response) {
    try {
      const data = replacementSchema.parse(req.body)
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que l'utilisateur est un admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      // Vérifier que les professeurs existent
      const [originalTeacher, replacementTeacher] = await Promise.all([
        prisma.user.findUnique({
          where: { id: data.originalTeacherId },
          select: { role: true },
        }),
        prisma.user.findUnique({
          where: { id: data.replacementTeacherId },
          select: { role: true },
        }),
      ])

      if (!originalTeacher || originalTeacher.role !== "TEACHER") {
        return res.status(404).json({ error: "Professeur original non trouvé" })
      }

      if (!replacementTeacher || replacementTeacher.role !== "TEACHER") {
        return res.status(404).json({ error: "Professeur remplaçant non trouvé" })
      }

      // Vérifier que le cours existe
      const course = await prisma.course.findUnique({
        where: { id: data.courseId },
        select: { teacherId: true },
      })

      if (!course) {
        return res.status(404).json({ error: "Cours non trouvé" })
      }

      if (course.teacherId !== data.originalTeacherId) {
        return res.status(400).json({ error: "Le cours n'appartient pas au professeur original" })
      }

      // Vérifier que le professeur remplaçant est disponible à cette date
      const replacementDate = new Date(data.date)
      const dayOfWeek = replacementDate.getDay()
      const time = replacementDate.toTimeString().slice(0, 5)

      const availability = await prisma.teacherAvailability.findFirst({
        where: {
          teacherId: data.replacementTeacherId,
          dayOfWeek,
          startTime: {
            lte: time,
          },
          endTime: {
            gte: time,
          },
        },
      })

      if (!availability) {
        return res.status(400).json({ error: "Le professeur remplaçant n'est pas disponible à cette date" })
      }

      const replacement = await prisma.teacherReplacement.create({
        data: {
          ...data,
          status: "PENDING",
        },
        include: {
          originalTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replacementTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return res.status(201).json(replacement)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la création du remplacement" })
    }
  },

  // Récupérer tous les remplacements
  async getAll(req: Request, res: Response) {
    try {
      const replacements = await prisma.teacherReplacement.findMany({
        include: {
          originalTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replacementTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      })

      return res.json(replacements)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des remplacements" })
    }
  },

  // Récupérer les remplacements d'un professeur
  async getTeacherReplacements(req: Request, res: Response) {
    try {
      const { teacherId } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que l'utilisateur est le professeur concerné ou un admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé" })
      }

      if (user.role !== "ADMIN" && userId !== teacherId) {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const replacements = await prisma.teacherReplacement.findMany({
        where: {
          OR: [
            { originalTeacherId: teacherId },
            { replacementTeacherId: teacherId },
          ],
        },
        include: {
          originalTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replacementTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
      })

      return res.json(replacements)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des remplacements" })
    }
  },

  // Mettre à jour le statut d'un remplacement
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que l'utilisateur est le professeur remplaçant ou un admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user) {
        return res.status(401).json({ error: "Utilisateur non trouvé" })
      }

      const replacement = await prisma.teacherReplacement.findUnique({
        where: { id },
        select: { replacementTeacherId: true },
      })

      if (!replacement) {
        return res.status(404).json({ error: "Remplacement non trouvé" })
      }

      if (user.role !== "ADMIN" && userId !== replacement.replacementTeacherId) {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const updatedReplacement = await prisma.teacherReplacement.update({
        where: { id },
        data: { status },
        include: {
          originalTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          replacementTeacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      return res.json(updatedReplacement)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour du remplacement" })
    }
  },

  // Supprimer un remplacement
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que l'utilisateur est un admin
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      await prisma.teacherReplacement.delete({
        where: { id },
      })

      return res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la suppression du remplacement" })
    }
  },
} 