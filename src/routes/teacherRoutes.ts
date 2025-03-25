import { Router } from 'express';
import { TeacherController } from '../controllers/TeacherController';

const router = Router();
const teacherController = new TeacherController();

// Routes pour les professeurs
router.post('/', teacherController.createTeacher);
router.get('/', teacherController.getAllTeachers);
router.get('/:id', teacherController.getTeacherById);

export default router; 