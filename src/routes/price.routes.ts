import { Router } from "express"
import { priceController } from "../controllers/price.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes pour les prix
router.get("/", priceController.getAllPrices)
router.get("/:courseId", priceController.getCoursePrice)
router.put("/:courseId", priceController.updatePrice)

export default router 