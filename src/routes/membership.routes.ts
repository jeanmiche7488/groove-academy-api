import { Router } from "express"
import { membershipController } from "../controllers/membership.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes pour les adhésions
router.get("/", membershipController.getAll)
router.get("/:id", membershipController.getById)
router.post("/", membershipController.create)
router.put("/:id", membershipController.update)
router.delete("/:id", membershipController.delete)

// Routes pour gérer les utilisateurs dans les adhésions
router.post("/:id/users", membershipController.addUser)
router.delete("/:id/users", membershipController.removeUser)

export default router 