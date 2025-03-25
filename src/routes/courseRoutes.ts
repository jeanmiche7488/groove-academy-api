import { Router } from 'express';
import { CourseController } from '../controllers/CourseController';

const router = Router();
const courseController = new CourseController();

// Routes pour les cours
router.post('/', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Route pour ajouter un étudiant à un cours
router.post('/:courseId/students/:studentId', courseController.addStudentToCourse);

export default router; 