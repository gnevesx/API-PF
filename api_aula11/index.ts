// index.ts

import 'dotenv/config'; // Importe no topo para carregar as variáveis de ambiente
import express from 'express';
import cors from 'cors';
import prisma from './prisma/client.js';

// Importando as rotas
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';

// Importando nosso middleware de autenticação
import { verificarToken } from './middlewares/auth.js';

const app = express();
const port = 3004;

app.use(express.json());
app.use(cors());

// Rota de verificação de conexão (não precisa de proteção)
app.get('/', async (req, res) => {
  try {
    await prisma.$connect();
    res.send('API de E-commerce de Roupas em Node.js - Conexão DB OK!');
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    res.status(500).send('API de E-commerce de Roupas em Node.js - Erro de Conexão DB!');
  } finally {
    await prisma.$disconnect();
  }
});

// --- REGISTRO DAS ROTAS ---

// Rotas públicas que não exigem login
app.use('/users', usersRoutes);       // (Aqui dentro teremos /login e /register)
app.use('/products', productsRoutes); // (Listar produtos é público)

// Rota protegida: o middleware `verificarToken` será executado para QUALQUER rota em '/cart'
app.use('/cart', verificarToken, cartRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
