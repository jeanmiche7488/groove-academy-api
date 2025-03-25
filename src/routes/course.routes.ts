import { Router } from "express"
import { courseController } from "../controllers/course.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(authenticateToken)

// Routes pour les cours
router.get("/", courseController.getCourses)
router.get("/:id", courseController.getCourse)
router.post("/", courseController.createCourse)
router.put("/:id", courseController.updateCourse)
router.delete("/:id", courseController.deleteCourse)

export default router 