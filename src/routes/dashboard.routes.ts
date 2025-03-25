import { Router } from "express"
import { dashboardController } from "../controllers/dashboard.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Toutes les routes du tableau de bord nécessitent une authentification
router.use(authenticateToken)

router.get("/stats", dashboardController.getStats)
router.get("/activities", dashboardController.getRecentActivities)

export default router 