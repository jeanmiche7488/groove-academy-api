import { Router } from "express"
import authRoutes from "./auth.routes"
import userRoutes from "./user.routes"
import courseRoutes from "./course.routes"
import priceRoutes from "./price.routes"
import membershipRoutes from "./membership.routes"
import messageRoutes from "./message.routes"
import availabilityRoutes from "./availability.routes"
import replacementRoutes from "./replacement.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/users", userRoutes)
router.use("/courses", courseRoutes)
router.use("/prices", priceRoutes)
router.use("/memberships", membershipRoutes)
router.use("/messages", messageRoutes)
router.use("/availabilities", availabilityRoutes)
router.use("/replacements", replacementRoutes)

export default router 