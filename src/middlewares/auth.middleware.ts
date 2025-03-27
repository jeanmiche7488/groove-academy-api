import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: string
  role: string
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Temporairement désactivé
  next()
  
  // const authHeader = req.headers.authorization
  // if (!authHeader) {
  //   return res.status(401).json({ message: "Token manquant" })
  // }

  // const token = authHeader.split(" ")[1]
  // if (!token) {
  //   return res.status(401).json({ message: "Token invalide" })
  // }

  // try {
  //   const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")
  //   req.user = decoded
  //   next()
  // } catch (error) {
  //   return res.status(401).json({ message: "Token invalide" })
  // }
} 