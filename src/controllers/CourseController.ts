import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CourseController {
  // Créer un nouveau cours
  async createCourse(req: Request, res: Response) {
    try {
      const { name, description, type, duration, price, maxStudents, teacherId } = req.body;

      const course = await prisma.course.create({
        data: {
          name,
          description,
          type,
          duration,
          price,
          maxStudents,
          teacherId,
        },
        include: {
          teacher: true,
        },
      });

      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la création du cours' });
    }
  }

  // Récupérer tous les cours
  async getAllCourses(req: Request, res: Response) {
    try {
      const courses = await prisma.course.findMany({
        include: {
          teacher: true,
          students: true,
        },
      });
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des cours' });
    }
  }

  // Récupérer un cours par son ID
  async getCourseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          teacher: true,
          students: true,
          schedules: true,
        },
      });

      if (!course) {
        return res.status(404).json({ error: 'Cours non trouvé' });
      }

      res.json(course);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération du cours' });
    }
  }

  // Mettre à jour un cours
  async updateCourse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, type, duration, price, maxStudents } = req.body;

      const course = await prisma.course.update({
        where: { id },
        data: {
          name,
          description,
          type,
          duration,
          price,
          maxStudents,
        },
        include: {
          teacher: true,
        },
      });

      res.json(course);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la mise à jour du cours' });
    }
  }

  // Supprimer un cours
  async deleteCourse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.course.delete({
        where: { id },
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du cours' });
    }
  }

  // Ajouter un étudiant à un cours
  async addStudentToCourse(req: Request, res: Response) {
    try {
      const { courseId, studentId } = req.params;
      
      const course = await prisma.course.update({
        where: { id: courseId },
        data: {
          students: {
            connect: { id: studentId },
          },
        },
        include: {
          students: true,
        },
      });

      res.json(course);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'étudiant au cours' });
    }
  }
} 