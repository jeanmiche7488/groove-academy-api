import { Router } from "express"
import { messageController } from "../controllers/message.controller"
import { authenticateToken } from "../middleware/auth"

const router = Router()

// Routes protégées par authentification
router.use(authenticateToken)

// Routes pour les messages
router.post("/", messageController.send)
router.get("/conversations", messageController.getConversations)
router.get("/:userId", messageController.getMessages)
router.put("/:messageId/read", messageController.markAsRead)

export default router 