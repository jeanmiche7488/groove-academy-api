import express from 'express';
import { AuthController } from './controllers/AuthController';
import { TeacherController } from './controllers/TeacherController';
import { authMiddleware } from './middleware/auth';
import { adminMiddleware } from './middleware/admin';

const router = express.Router();
const authController = new AuthController();
const teacherController = new TeacherController();

// Routes d'authentification
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/resend-verification', authController.resendVerificationEmail);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.post('/auth/change-password', authMiddleware, authController.changePassword);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);
router.put('/auth/me', authMiddleware, authController.updateProfile);

// Routes des professeurs (protégées par authentification et rôle admin)
router.post('/teachers', authMiddleware, adminMiddleware, teacherController.createTeacher);
router.get('/teachers', authMiddleware, adminMiddleware, teacherController.getAllTeachers);
router.get('/teachers/:id', authMiddleware, adminMiddleware, teacherController.getTeacherById);
router.put('/teachers/:id', authMiddleware, adminMiddleware, teacherController.updateTeacher);
router.delete('/teachers/:id', authMiddleware, adminMiddleware, teacherController.deleteTeacher);

export default router; 