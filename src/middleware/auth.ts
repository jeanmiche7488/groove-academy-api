import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface JwtPayload {
  userId: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ error: "Token d'authentification manquant" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as { userId: string }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return res.status(401).json({ error: "Utilisateur non trouvé" })
    }

    req.user = user
    next()
  } catch (error) {
    res.status(401).json({ error: "Token invalide" })
  }
} 