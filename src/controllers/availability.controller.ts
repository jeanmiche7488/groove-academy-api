import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

const availabilitySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  room: z.string().optional(),
})

export const availabilityController = {
  // Créer une disponibilité
  async create(req: Request, res: Response) {
    try {
      const data = availabilitySchema.parse(req.body)
      const teacherId = req.user?.id

      if (!teacherId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que l'utilisateur est un professeur
      const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { role: true },
      })

      if (!teacher || teacher.role !== "TEACHER") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const availability = await prisma.teacherAvailability.create({
        data: {
          ...data,
          teacherId,
        },
      })

      return res.status(201).json(availability)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la création de la disponibilité" })
    }
  },

  // Récupérer les disponibilités d'un professeur
  async getTeacherAvailabilities(req: Request, res: Response) {
    try {
      const { teacherId } = req.params

      const availabilities = await prisma.teacherAvailability.findMany({
        where: { teacherId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      })

      return res.json(availabilities)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des disponibilités" })
    }
  },

  // Récupérer les disponibilités de l'utilisateur connecté (si c'est un professeur)
  async getMyAvailabilities(req: Request, res: Response) {
    try {
      const teacherId = req.user?.id

      if (!teacherId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      const availabilities = await prisma.teacherAvailability.findMany({
        where: { teacherId },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' },
        ],
      })

      return res.json(availabilities)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des disponibilités" })
    }
  },

  // Mettre à jour une disponibilité
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = availabilitySchema.partial().parse(req.body)
      const teacherId = req.user?.id

      if (!teacherId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que la disponibilité appartient au professeur
      const availability = await prisma.teacherAvailability.findUnique({
        where: { id },
        select: { teacherId: true },
      })

      if (!availability || availability.teacherId !== teacherId) {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const updatedAvailability = await prisma.teacherAvailability.update({
        where: { id },
        data,
      })

      return res.json(updatedAvailability)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour de la disponibilité" })
    }
  },

  // Supprimer une disponibilité
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const teacherId = req.user?.id

      if (!teacherId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que la disponibilité appartient au professeur
      const availability = await prisma.teacherAvailability.findUnique({
        where: { id },
        select: { teacherId: true },
      })

      if (!availability || availability.teacherId !== teacherId) {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      await prisma.teacherAvailability.delete({
        where: { id },
      })

      return res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la suppression de la disponibilité" })
    }
  },
} 