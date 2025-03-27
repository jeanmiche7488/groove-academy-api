import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import teachersRoutes from './routes/teachers.routes';
import authRoutes from './routes/auth.routes';
import statsRoutes from './routes/stats.routes';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuration CORS
app.use(cors({
  origin: 'http://localhost:3000', // URL du frontend
  credentials: true, // Important pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teachersRoutes);
app.use('/api/stats', statsRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenue sur l\'API de Groove Academy' });
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
}); 