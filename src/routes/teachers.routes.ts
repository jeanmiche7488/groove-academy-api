import { Router } from 'express'
import { TeacherController } from '../controllers/TeacherController'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const teacherController = new TeacherController()

// Routes protégées par authentification
router.use(authMiddleware)

// Routes pour les professeurs
router.get('/', teacherController.getAllTeachers)
router.get('/:id', teacherController.getTeacherById)
router.post('/', teacherController.createTeacher)
router.put('/:id', teacherController.updateTeacher)

// Routes pour les instruments des professeurs
router.put('/:id/instruments', teacherController.updateInstruments)

// Routes pour les ateliers des professeurs
router.put('/:id/workshops', teacherController.updateWorkshops)

// Routes pour les disponibilités des professeurs
router.post('/:id/availabilities', teacherController.addAvailability)

export default router 