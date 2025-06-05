import express from 'express';
import cors from 'cors';
import usersRoutes from './routes/users.js';
import productsRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import prisma from './prisma/client.js'; // <-- Importe o cliente Prisma

const app = express();
const port = 3004;

app.use(express.json());
app.use(cors());

// Exemplo de como usar o Prisma para verificar a conexão
app.get('/', async (req, res) => {
  try {
    await prisma.$connect(); // Tenta conectar ao banco de dados
    res.send('API de E-commerce de Roupas em Node.js - Conexão DB OK!');
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    res.status(500).send('API de E-commerce de Roupas em Node.js - Erro de Conexão DB!');
  } finally {
    await prisma.$disconnect(); // Desconecta após a verificação
  }
});


app.use('/users', usersRoutes);
app.use('/products', productsRoutes);
app.use('/cart', cartRoutes);

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});