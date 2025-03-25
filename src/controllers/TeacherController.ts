import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class TeacherController {
  // Créer un nouveau professeur
  async createTeacher(req: Request, res: Response) {
    try {
      const { firstName, lastName, email, password, phone, specialty, bio } = req.body;

      // Vérifier si l'email existe déjà
      const existingTeacher = await prisma.user.findUnique({
        where: { email }
      });

      if (existingTeacher) {
        return res.status(400).json({ error: 'Un professeur avec cet email existe déjà' });
      }

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer le professeur
      const teacher = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: 'TEACHER',
          phone,
          specialty,
          bio
        }
      });

      // Ne pas renvoyer le mot de passe
      const { password: _, ...teacherWithoutPassword } = teacher;
      res.status(201).json(teacherWithoutPassword);
    } catch (error) {
      console.error('Erreur lors de la création du professeur:', error);
      res.status(500).json({ error: 'Erreur lors de la création du professeur' });
    }
  }

  // Récupérer tous les professeurs
  async getAllTeachers(req: Request, res: Response) {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: 'TEACHER' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          specialty: true,
          bio: true
        }
      });
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des professeurs' });
    }
  }

  // Récupérer un professeur par son ID
  async getTeacherById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const teacher = await prisma.user.findUnique({
        where: { id, role: 'TEACHER' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          specialty: true,
          bio: true
        }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      res.json(teacher);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération du professeur' });
    }
  }
} 