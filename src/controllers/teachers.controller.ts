import { Request, Response } from "express"
import { PrismaClient, UserRole } from "@prisma/client"

const prisma = new PrismaClient()

export const teachersController = {
  // Récupérer tous les professeurs
  async getAllTeachers(req: Request, res: Response) {
    try {
      const teachers = await prisma.user.findMany({
        where: {
          role: UserRole.TEACHER
        },
        include: {
          teacherProfile: {
            include: {
              instruments: true,
              workshops: true,
              courses: {
                include: {
                  enrollments: true
                }
              }
            }
          }
        }
      })

      // Calculer les statistiques pour chaque professeur
      const teachersWithStats = teachers.map(teacher => {
        const totalStudents = teacher.teacherProfile?.courses.reduce((acc, course) => 
          acc + course.enrollments.length, 0) || 0
        const totalCourses = teacher.teacherProfile?.courses.length || 0
        const monthlyEarnings = teacher.teacherProfile?.courses.reduce((acc, course) => 
          acc + (course.pricePerStudent * course.enrollments.length), 0) || 0

        return {
          ...teacher,
          stats: {
            totalStudents,
            totalCourses,
            monthlyEarnings
          }
        }
      })

      res.json(teachersWithStats)
    } catch (error) {
      console.error("Erreur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Récupérer un professeur par son ID
  async getTeacherById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const teacher = await prisma.user.findUnique({
        where: { 
          id,
          role: UserRole.TEACHER
        },
        include: {
          teacherProfile: {
            include: {
              instruments: true,
              workshops: true,
              courses: {
                include: {
                  enrollments: true
                }
              }
            }
          }
        }
      })

      if (!teacher) {
        return res.status(404).json({ message: "Professeur non trouvé" })
      }

      // Calculer les statistiques
      const totalStudents = teacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + course.enrollments.length, 0) || 0
      const totalCourses = teacher.teacherProfile?.courses.length || 0
      const monthlyEarnings = teacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + (course.pricePerStudent * course.enrollments.length), 0) || 0

      const teacherWithStats = {
        ...teacher,
        stats: {
          totalStudents,
          totalCourses,
          monthlyEarnings
        }
      }

      res.json(teacherWithStats)
    } catch (error) {
      console.error("Erreur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Créer un nouveau professeur
  async createTeacher(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password, phone, specialty, hourlyRate } = req.body
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password,
          phone,
          specialty,
          hourlyRate,
          role: UserRole.TEACHER,
          teacherProfile: {
            create: {}
          }
        },
        include: {
          teacherProfile: true
        }
      })

      res.status(201).json(user)
    } catch (error) {
      console.error("Erreur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Mettre à jour un professeur
  async updateTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { firstName, lastName, email, phone, specialty, hourlyRate } = req.body

      const teacher = await prisma.user.findUnique({
        where: { 
          id,
          role: UserRole.TEACHER
        }
      })

      if (!teacher) {
        return res.status(404).json({ message: "Professeur non trouvé" })
      }

      const updatedTeacher = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          email,
          phone,
          specialty,
          hourlyRate
        },
        include: {
          teacherProfile: {
            include: {
              instruments: true,
              workshops: true,
              courses: {
                include: {
                  enrollments: true
                }
              }
            }
          }
        }
      })

      // Calculer les statistiques
      const totalStudents = updatedTeacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + course.enrollments.length, 0) || 0
      const totalCourses = updatedTeacher.teacherProfile?.courses.length || 0
      const monthlyEarnings = updatedTeacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + (course.pricePerStudent * course.enrollments.length), 0) || 0

      const teacherWithStats = {
        ...updatedTeacher,
        stats: {
          totalStudents,
          totalCourses,
          monthlyEarnings
        }
      }

      res.json(teacherWithStats)
    } catch (error) {
      console.error("Erreur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  },

  // Supprimer un professeur
  async deleteTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params

      const teacher = await prisma.user.findUnique({
        where: { 
          id,
          role: UserRole.TEACHER
        }
      })

      if (!teacher) {
        return res.status(404).json({ message: "Professeur non trouvé" })
      }

      // Supprimer d'abord le profil du professeur
      await prisma.teacher.delete({
        where: { userId: id }
      })

      // Puis supprimer l'utilisateur
      await prisma.user.delete({
        where: { id }
      })

      res.status(204).send()
    } catch (error) {
      console.error("Erreur:", error)
      res.status(500).json({ message: "Erreur serveur" })
    }
  }
} 