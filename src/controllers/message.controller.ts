import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

const messageSchema = z.object({
  content: z.string(),
  receiverId: z.string().uuid(),
})

export const messageController = {
  // Envoyer un message
  async send(req: Request, res: Response) {
    try {
      const data = messageSchema.parse(req.body)
      const senderId = req.user?.id

      if (!senderId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      // Vérifier que le destinataire existe
      const receiver = await prisma.user.findUnique({
        where: { id: data.receiverId },
      })

      if (!receiver) {
        return res.status(404).json({ error: "Destinataire non trouvé" })
      }

      const message = await prisma.message.create({
        data: {
          content: data.content,
          senderId,
          receiverId: data.receiverId,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return res.status(201).json(message)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de l'envoi du message" })
    }
  },

  // Récupérer les conversations d'un utilisateur
  async getConversations(req: Request, res: Response) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      const conversations = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      // Grouper les messages par conversation
      const groupedConversations = conversations.reduce((acc, message) => {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId
        const otherUser = message.senderId === userId ? message.receiver : message.sender

        if (!acc[otherUserId]) {
          acc[otherUserId] = {
            user: otherUser,
            messages: [],
            lastMessage: message,
          }
        }
        acc[otherUserId].messages.push(message)
        return acc
      }, {} as Record<string, any>)

      return res.json(Object.values(groupedConversations))
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des conversations" })
    }
  },

  // Récupérer les messages d'une conversation spécifique
  async getMessages(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const currentUserId = req.user?.id

      if (!currentUserId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: userId },
            { senderId: userId, receiverId: currentUserId },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      return res.json(messages)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la récupération des messages" })
    }
  },

  // Marquer un message comme lu
  async markAsRead(req: Request, res: Response) {
    try {
      const { messageId } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ error: "Non authentifié" })
      }

      const message = await prisma.message.update({
        where: {
          id: messageId,
          receiverId: userId,
        },
        data: {
          read: true,
        },
      })

      return res.json(message)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: "Erreur lors de la mise à jour du message" })
    }
  },
} 