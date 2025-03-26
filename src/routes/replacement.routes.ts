import { Router } from "express"
import { replacementController } from "../controllers/replacement.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes pour les remplacements
router.post("/", replacementController.create)
router.get("/", replacementController.getAll)
router.get("/teacher/:teacherId", replacementController.getTeacherReplacements)
router.put("/:id/status", replacementController.updateStatus)
router.delete("/:id", replacementController.delete)

export default router 