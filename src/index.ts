import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
// Diğer importlar...

const app = express();

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(express.json());
// Diğer middleware'ler...

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('Swagger JSON dokümantasyonu talep edildi');
  res.send(swaggerSpec);
});
// Swagger JSON dokümantasyonunu sunar
app.get('/', (req, res) => {
  res.send(`
    <h1>Sportlink API</h1>
    <p>Hoş geldiniz! API dokümantasyonu entegre edilmiştir.</p>
    <p>Dokümantasyona erişmek için: <a href="/api-docs">API Dokümantasyonu (Swagger UI)</a></p>
    <p>JSON formatında erişmek için: <a href="/swagger.json">swagger.json</a></p>
  `);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});