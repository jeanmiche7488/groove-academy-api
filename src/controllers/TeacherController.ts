import { Request, Response } from 'express';
import { PrismaClient, UserRole, InstrumentType, WorkshopType, User, Teacher } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class TeacherController {
  // Créer un nouveau professeur
  async createTeacher(req: Request, res: Response) {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        phone,
        specialty,
        hourlyRate,
        instruments,
        workshops
      } = req.body;

      const existingTeacher = await prisma.user.findUnique({
        where: { email }
      });

      if (existingTeacher) {
        return res.status(400).json({ error: 'Un professeur avec cet email existe déjà' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur avec le rôle TEACHER et son profil
      const user = await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          password: hashedPassword,
          role: UserRole.TEACHER,
          phone,
          specialty,
          hourlyRate,
          teacherProfile: {
            create: {
              instruments: {
                create: instruments?.map((instrument: { instrument: InstrumentType, level: string }) => ({
                  instrument: instrument.instrument,
                  level: instrument.level
                })) || []
              },
              workshops: {
                create: workshops?.map((workshop: { type: WorkshopType, description?: string }) => ({
                  workshopType: workshop.type,
                  description: workshop.description
                })) || []
              }
            }
          }
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
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Erreur lors de la création du professeur:', error);
      res.status(500).json({ error: 'Erreur lors de la création du professeur' });
    }
  }

  // Récupérer tous les professeurs
  async getAllTeachers(req: Request, res: Response) {
    try {
      const teachers = await prisma.user.findMany({
        where: { role: UserRole.TEACHER },
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
      });

      // Calculer les statistiques pour chaque professeur
      const teachersWithStats = teachers.map(teacher => {
        const totalStudents = teacher.teacherProfile?.courses.reduce((acc, course) => 
          acc + course.enrollments.length, 0) || 0;
        const totalCourses = teacher.teacherProfile?.courses.length || 0;
        const monthlyEarnings = teacher.teacherProfile?.courses.reduce((acc, course) => 
          acc + (course.pricePerStudent * course.enrollments.length), 0) || 0;

        return {
          ...teacher,
          stats: {
            totalStudents,
            totalCourses,
            monthlyEarnings
          }
        };
      });

      res.json(teachersWithStats);
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des professeurs' });
    }
  }

  // Récupérer un professeur par son ID
  async getTeacherById(req: Request, res: Response) {
    try {
      const { id } = req.params;
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
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      // Calculer les statistiques
      const totalStudents = teacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + course.enrollments.length, 0) || 0;
      const totalCourses = teacher.teacherProfile?.courses.length || 0;
      const monthlyEarnings = teacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + (course.pricePerStudent * course.enrollments.length), 0) || 0;

      const teacherWithStats = {
        ...teacher,
        stats: {
          totalStudents,
          totalCourses,
          monthlyEarnings
        }
      };

      res.json(teacherWithStats);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération du professeur' });
    }
  }

  // Mettre à jour un professeur
  async updateTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { firstName, lastName, phone, specialty, hourlyRate, instruments, workshops } = req.body;

      console.log('Mise à jour du professeur:', { id, body: req.body });

      // Vérifier si l'utilisateur existe et est un professeur
      const user = await prisma.user.findUnique({
        where: { 
          id,
          role: UserRole.TEACHER
        },
        include: { teacherProfile: true }
      });

      if (!user || !user.teacherProfile) {
        console.error('Professeur non trouvé:', id);
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      console.log('Professeur trouvé:', user);

      // Mettre à jour les informations de base
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          firstName,
          lastName,
          phone,
          specialty,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined
        }
      });

      console.log('Informations de base mises à jour:', updatedUser);

      // Mettre à jour les instruments si fournis
      if (instruments && instruments.length > 0) {
        await prisma.teacherInstrument.deleteMany({
          where: { teacherId: user.teacherProfile.id }
        });

        const updatedInstruments = await prisma.teacher.update({
          where: { id: user.teacherProfile.id },
          data: {
            instruments: {
              create: instruments.map((instrument: { instrument: InstrumentType, level: string }) => ({
                instrument: instrument.instrument,
                level: instrument.level
              }))
            }
          }
        });

        console.log('Instruments mis à jour:', updatedInstruments);
      }

      // Mettre à jour les ateliers si fournis
      if (workshops && workshops.length > 0) {
        await prisma.teacherWorkshop.deleteMany({
          where: { teacherId: user.teacherProfile.id }
        });

        const updatedWorkshops = await prisma.teacher.update({
          where: { id: user.teacherProfile.id },
          data: {
            workshops: {
              create: workshops.map((workshop: { type: WorkshopType, description?: string }) => ({
                workshopType: workshop.type,
                description: workshop.description
              }))
            }
          }
        });

        console.log('Ateliers mis à jour:', updatedWorkshops);
      }

      // Récupérer le professeur mis à jour avec toutes ses relations
      const updatedTeacher = await prisma.user.findUnique({
        where: { id },
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
      });

      if (!updatedTeacher) {
        console.error('Professeur non trouvé après mise à jour:', id);
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      // Calculer les statistiques
      const totalStudents = updatedTeacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + course.enrollments.length, 0) || 0;
      const totalCourses = updatedTeacher.teacherProfile?.courses.length || 0;
      const monthlyEarnings = updatedTeacher.teacherProfile?.courses.reduce((acc, course) => 
        acc + (course.pricePerStudent * course.enrollments.length), 0) || 0;

      const teacherWithStats = {
        ...updatedTeacher,
        stats: {
          totalStudents,
          totalCourses,
          monthlyEarnings
        }
      };

      console.log('Professeur mis à jour avec succès:', teacherWithStats);
      res.json(teacherWithStats);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du professeur:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du professeur' });
    }
  }

  // Supprimer un professeur
  async deleteTeacher(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await prisma.user.delete({
        where: { 
          id,
          role: UserRole.TEACHER
        }
      });

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la suppression du professeur' });
    }
  }

  // Mettre à jour les instruments d'un professeur
  async updateInstruments(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { instruments } = req.body;

      // Vérifier si l'utilisateur existe et est un professeur
      const user = await prisma.user.findUnique({
        where: { id },
        include: { teacherProfile: true }
      });

      if (!user || !user.teacherProfile) {
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      // Supprimer les instruments existants
      await prisma.teacherInstrument.deleteMany({
        where: { teacherId: user.teacherProfile.id }
      });

      // Ajouter les nouveaux instruments
      const updatedTeacher = await prisma.teacher.update({
        where: { id: user.teacherProfile.id },
        data: {
          instruments: {
            create: instruments.map((instrument: { type: InstrumentType, level: string }) => ({
              instrument: instrument.type,
              level: instrument.level
            }))
          }
        },
        include: {
          instruments: true
        }
      });

      res.json(updatedTeacher);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des instruments:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des instruments' });
    }
  }

  // Mettre à jour les ateliers d'un professeur
  async updateWorkshops(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { workshops } = req.body;

      // Vérifier si l'utilisateur existe et est un professeur
      const user = await prisma.user.findUnique({
        where: { id },
        include: { teacherProfile: true }
      });

      if (!user || !user.teacherProfile) {
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      // Supprimer les ateliers existants
      await prisma.teacherWorkshop.deleteMany({
        where: { teacherId: user.teacherProfile.id }
      });

      // Ajouter les nouveaux ateliers
      const updatedTeacher = await prisma.teacher.update({
        where: { id: user.teacherProfile.id },
        data: {
          workshops: {
            create: workshops.map((workshop: { type: WorkshopType, description?: string }) => ({
              workshopType: workshop.type,
              description: workshop.description
            }))
          }
        },
        include: {
          workshops: true
        }
      });

      res.json(updatedTeacher);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des ateliers:', error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour des ateliers' });
    }
  }

  // Ajouter des disponibilités à un professeur
  async addAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { availabilities } = req.body;

      // Vérifier si l'utilisateur existe et est un professeur
      const user = await prisma.user.findUnique({
        where: { id },
        include: { teacherProfile: true }
      });

      if (!user || !user.teacherProfile) {
        return res.status(404).json({ error: 'Professeur non trouvé' });
      }

      const teacherProfile = user.teacherProfile as Teacher;

      // Ajouter les nouvelles disponibilités
      const createdAvailabilities = await prisma.teacherAvailability.createMany({
        data: availabilities.map((availability: { 
          dayOfWeek: number, 
          startTime: string, 
          endTime: string 
        }) => ({
          teacherId: teacherProfile.id,
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime
        }))
      });

      res.status(201).json(createdAvailabilities);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des disponibilités:', error);
      res.status(500).json({ error: 'Erreur lors de l\'ajout des disponibilités' });
    }
  }
} 