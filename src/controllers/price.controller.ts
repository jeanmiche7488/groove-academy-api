import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

const priceSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default("EUR"),
})

export const priceController = {
  // Mettre à jour le prix d'un cours
  async updatePrice(req: Request, res: Response) {
    try {
      const { courseId } = req.params
      const data = priceSchema.parse(req.body)

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      // Vérifier que le cours existe
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      })

      if (!course) {
        return res.status(404).json({ error: "Cours non trouvé" })
      }

      // Mettre à jour ou créer le prix
      const price = await prisma.price.upsert({
        where: { courseId },
        update: {
          amount: data.amount,
          currency: data.currency,
        },
        create: {
          amount: data.amount,
          currency: data.currency,
          courseId,
        },
      })

      return res.json(price)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour du prix" })
    }
  },

  // Récupérer tous les prix
  async getAllPrices(req: Request, res: Response) {
    try {
      const prices = await prisma.price.findMany({
        include: {
          course: {
            select: {
              name: true,
              type: true,
              category: true,
            },
          },
        },
      })
      return res.json(prices)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des prix" })
    }
  },

  // Récupérer le prix d'un cours spécifique
  async getCoursePrice(req: Request, res: Response) {
    try {
      const { courseId } = req.params
      const price = await prisma.price.findUnique({
        where: { courseId },
        include: {
          course: {
            select: {
              name: true,
              type: true,
              category: true,
            },
          },
        },
      })

      if (!price) {
        return res.status(404).json({ error: "Prix non trouvé" })
      }

      return res.json(price)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération du prix" })
    }
  },
} 