import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { CourseType, CourseCategory } from "@prisma/client"

const prisma = new PrismaClient()

export const courseController = {
  async getCourses(req: Request, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          teacher: true,
          students: true,
        },
      })

      res.json(courses)
    } catch (error) {
      console.error("Erreur lors de la récupération des cours:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async getCourse(req: Request, res: Response) {
    try {
      const { id } = req.params
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          teacher: true,
          students: true,
        },
      })

      if (!course) {
        return res.status(404).json({ message: "Cours non trouvé" })
      }

      res.json(course)
    } catch (error) {
      console.error("Erreur lors de la récupération du cours:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async createCourse(req: Request, res: Response) {
    try {
      const {
        name,
        description,
        type,
        category,
        duration,
        maxStudents,
        instrumentType,
        workshopType,
      } = req.body

      // Vérifier que l'utilisateur est un professeur
      if (req.user?.role !== "TEACHER") {
        return res.status(403).json({ message: "Accès non autorisé" })
      }

      const course = await prisma.course.create({
        data: {
          name,
          description,
          type,
          category,
          duration,
          maxStudents,
          instrumentType,
          workshopType,
          teacherId: req.user.userId,
        },
        include: {
          teacher: true,
        },
      })

      res.status(201).json(course)
    } catch (error) {
      console.error("Erreur lors de la création du cours:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async updateCourse(req: Request, res: Response) {
    try {
      const { id } = req.params
      const {
        name,
        description,
        type,
        category,
        duration,
        maxStudents,
        instrumentType,
        workshopType,
      } = req.body

      // Vérifier que le cours existe et que l'utilisateur est le professeur
      const course = await prisma.course.findUnique({
        where: { id },
        select: { teacherId: true },
      })

      if (!course) {
        return res.status(404).json({ message: "Cours non trouvé" })
      }

      if (course.teacherId !== req.user?.userId) {
        return res.status(403).json({ message: "Accès non autorisé" })
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          name,
          description,
          type,
          category,
          duration,
          maxStudents,
          instrumentType,
          workshopType,
        },
        include: {
          teacher: true,
        },
      })

      res.json(updatedCourse)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du cours:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  async deleteCourse(req: Request, res: Response) {
    try {
      const { id } = req.params

      // Vérifier que le cours existe et que l'utilisateur est le professeur
      const course = await prisma.course.findUnique({
        where: { id },
        select: { teacherId: true },
      })

      if (!course) {
        return res.status(404).json({ message: "Cours non trouvé" })
      }

      if (course.teacherId !== req.user?.userId) {
        return res.status(403).json({ message: "Accès non autorisé" })
      }

      await prisma.course.delete({
        where: { id },
      })

      res.status(204).send()
    } catch (error) {
      console.error("Erreur lors de la suppression du cours:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },
} 