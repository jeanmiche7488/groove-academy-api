import { Router } from "express"
import { courseController } from "../controllers/course.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes CRUD pour les cours
router.post("/", courseController.create)
router.get("/", courseController.getAll)
router.get("/:id", courseController.getById)
router.put("/:id", courseController.update)
router.delete("/:id", courseController.delete)

// Routes pour la gestion des étudiants dans un cours
router.post("/:courseId/students/:studentId", courseController.addStudent)
router.delete("/:courseId/students/:studentId", courseController.removeStudent)

export default router 