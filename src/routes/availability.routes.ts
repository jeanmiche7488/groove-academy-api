import { Router } from "express"
import { availabilityController } from "../controllers/availability.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes pour les disponibilités
router.post("/", availabilityController.create)
router.get("/my", availabilityController.getMyAvailabilities)
router.get("/teacher/:teacherId", availabilityController.getTeacherAvailabilities)
router.put("/:id", availabilityController.update)
router.delete("/:id", availabilityController.delete)

export default router 