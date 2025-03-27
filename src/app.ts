import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import teacherRoutes from './routes/teachers.routes'
import statsRoutes from './routes/stats.routes'

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/teachers', teacherRoutes)
app.use('/api/stats', statsRoutes)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`)
})

export default app 