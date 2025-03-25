import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      console.log("Tentative de connexion pour l'email:", email)

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email },
      })

      console.log("Utilisateur trouvé:", user ? "Oui" : "Non")

      if (!user) {
        console.log("Utilisateur non trouvé")
        return res.status(401).json({ message: "Email ou mot de passe incorrect" })
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password)
      console.log("Mot de passe valide:", isValidPassword)

      if (!isValidPassword) {
        console.log("Mot de passe invalide")
        return res.status(401).json({ message: "Email ou mot de passe incorrect" })
      }

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      )

      console.log("Token généré avec succès")

      // Définir le cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 heures
      })

      // Retourner l'utilisateur et le token
      const { password: _, ...userWithoutPassword } = user
      res.json({ user: userWithoutPassword, token })
    } catch (error) {
      console.error("Erreur détaillée de connexion:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async logout(req: Request, res: Response) {
    try {
      // Supprimer le cookie
      res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
      res.json({ message: "Déconnexion réussie" })
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" })
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10)

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role,
        },
      })

      // Générer le token JWT
      const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "24h" }
      )

      // Retourner l'utilisateur et le token
      const { password: _, ...userWithoutPassword } = user
      res.status(201).json({ user: userWithoutPassword, token })
    } catch (error) {
      console.error("Erreur d'inscription:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" })
      }

      // TODO: Implémenter l'envoi d'email de réinitialisation
      res.json({ message: "Instructions envoyées par email" })
    } catch (error) {
      console.error("Erreur de réinitialisation de mot de passe:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = req.body

      // TODO: Vérifier le token et mettre à jour le mot de passe
      res.json({ message: "Mot de passe mis à jour avec succès" })
    } catch (error) {
      console.error("Erreur de réinitialisation de mot de passe:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
} 