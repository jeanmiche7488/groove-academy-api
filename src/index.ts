import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import courseRoutes from './routes/courseRoutes';
import teacherRoutes from './routes/teacherRoutes';
import authRoutes from './routes/auth.routes';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Body:', req.body);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/teachers', teacherRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Groove Academy' });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
}); 