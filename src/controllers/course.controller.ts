import { Request, Response } from "express"
import { PrismaClient } from "@prisma/client"
import { z } from 'zod'

const prisma = new PrismaClient()

// Schéma de validation pour la création d'un cours
const createCourseSchema = z.object({
  name: z.string(),
  type: z.enum(['INSTRUMENT', 'WORKSHOP']),
  category: z.enum(['INDIVIDUAL', 'DUO_TRIO']),
  instrument: z.enum(['GUITAR', 'BASS', 'PIANO', 'VOCAL', 'DRUMS']).optional(),
  workshop: z.enum(['JAM_SESSION', 'COMPOSITION', 'CONCERT_PREP', 'IMPROVISATION']).optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  description: z.string().optional(),
  objectives: z.string().optional(),
  maxStudents: z.number().int().min(1).max(6),
  duration: z.number().int().min(30).max(180),
  price: z.number().positive(),
  teacherId: z.string().uuid(),
  schedules: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    room: z.string().optional(),
  })),
})

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

  // Créer un nouveau cours
  async create(req: Request, res: Response) {
    try {
      const data = createCourseSchema.parse(req.body)

      // Vérifier que le professeur existe
      const teacher = await prisma.user.findUnique({
        where: { id: data.teacherId },
        include: { teacherCourses: true },
      })

      if (!teacher) {
        return res.status(404).json({ error: 'Professeur non trouvé' })
      }

      // Créer le cours avec ses horaires
      const course = await prisma.course.create({
        data: {
          name: data.name,
          type: data.type,
          category: data.category,
          instrument: data.instrument,
          workshop: data.workshop,
          level: data.level,
          description: data.description,
          objectives: data.objectives,
          maxStudents: data.maxStudents,
          duration: data.duration,
          price: parseFloat(data.price.toString()),
          teacherId: data.teacherId,
          schedules: {
            create: data.schedules,
          },
        },
        include: {
          teacher: true,
          schedules: true,
        },
      })

      return res.status(201).json(course)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de la création du cours' })
    }
  },

  // Récupérer tous les cours
  async getAll(req: Request, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          teacher: true,
          schedules: true,
          students: true,
        },
      })
      return res.json(courses)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de la récupération des cours' })
    }
  },

  // Récupérer un cours par son ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          teacher: true,
          schedules: true,
          students: true,
        },
      })

      if (!course) {
        return res.status(404).json({ error: 'Cours non trouvé' })
      }

      return res.json(course)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de la récupération du cours' })
    }
  },

  // Mettre à jour un cours
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const data = createCourseSchema.partial().parse(req.body)

      const course = await prisma.course.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          category: data.category,
          instrument: data.instrument,
          workshop: data.workshop,
          level: data.level,
          description: data.description,
          objectives: data.objectives,
          maxStudents: data.maxStudents,
          duration: data.duration,
          price: data.price ? parseFloat(data.price.toString()) : undefined,
        },
        include: {
          teacher: true,
          schedules: true,
        },
      })

      return res.json(course)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors })
      }
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du cours' })
    }
  },

  // Supprimer un cours
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      await prisma.course.delete({
        where: { id },
      })
      return res.status(204).send()
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de la suppression du cours' })
    }
  },

  // Ajouter un étudiant à un cours
  async addStudent(req: Request, res: Response) {
    try {
      const { courseId, studentId } = req.params

      // Vérifier que le cours existe et n'est pas plein
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { students: true },
      })

      if (!course) {
        return res.status(404).json({ error: 'Cours non trouvé' })
      }

      if (course.maxStudents && course.students.length >= course.maxStudents) {
        return res.status(400).json({ error: 'Le cours est complet' })
      }

      // Ajouter l'étudiant au cours
      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          students: {
            connect: { id: studentId },
          },
        },
        include: {
          students: true,
        },
      })

      return res.json(updatedCourse)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'étudiant au cours' })
    }
  },

  // Retirer un étudiant d'un cours
  async removeStudent(req: Request, res: Response) {
    try {
      const { courseId, studentId } = req.params

      const updatedCourse = await prisma.course.update({
        where: { id: courseId },
        data: {
          students: {
            disconnect: { id: studentId },
          },
        },
        include: {
          students: true,
        },
      })

      return res.json(updatedCourse)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ error: error.message })
      }
      return res.status(500).json({ error: 'Erreur lors du retrait de l\'étudiant du cours' })
    }
  },
} 