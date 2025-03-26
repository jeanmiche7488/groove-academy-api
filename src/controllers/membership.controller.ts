import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

const membershipSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  type: z.enum(['MANDATORY', 'OPTIONAL']),
  duration: z.number().int().positive(),
  price: z.number().positive(),
  features: z.array(z.string()),
})

export const membershipController = {
  // Créer une nouvelle adhésion
  async create(req: Request, res: Response) {
    try {
      const data = membershipSchema.parse(req.body)

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const membership = await prisma.membership.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          duration: data.duration,
          price: data.price,
          features: data.features,
        },
      })

      return res.status(201).json(membership)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la création de l'adhésion" })
    }
  },

  // Récupérer toutes les adhésions
  async getAll(req: Request, res: Response) {
    try {
      const memberships = await prisma.membership.findMany({
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })
      return res.json(memberships)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des adhésions" })
    }
  },

  // Récupérer une adhésion spécifique
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const membership = await prisma.membership.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      if (!membership) {
        return res.status(404).json({ error: "Adhésion non trouvée" })
      }

      return res.json(membership)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération de l'adhésion" })
    }
  },

  // Mettre à jour une adhésion
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = membershipSchema.partial().parse(req.body)

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const membership = await prisma.membership.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          duration: data.duration,
          price: data.price,
          features: data.features,
        },
      })

      return res.json(membership)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour de l'adhésion" })
    }
  },

  // Supprimer une adhésion
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      await prisma.membership.delete({
        where: { id },
      })

      return res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la suppression de l'adhésion" })
    }
  },

  // Ajouter un utilisateur à une adhésion
  async addUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { userId } = req.body

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const membership = await prisma.membership.update({
        where: { id },
        data: {
          users: {
            connect: { id: userId },
          },
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return res.json(membership)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de l'ajout de l'utilisateur à l'adhésion" })
    }
  },

  // Retirer un utilisateur d'une adhésion
  async removeUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { userId } = req.body

      // Vérifier que l'utilisateur est un admin
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Accès non autorisé" })
      }

      const membership = await prisma.membership.update({
        where: { id },
        data: {
          users: {
            disconnect: { id: userId },
          },
        },
        include: {
          users: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return res.json(membership)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors du retrait de l'utilisateur de l'adhésion" })
    }
  },
} 