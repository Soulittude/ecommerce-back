import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { timeStamp } from 'console';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// --- Middleware ---
app.use(helmet());  //Security headers
app.use(cors());    //Enable cors for all origins
app.use(express.json()) //Parse JSON bodies
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, //15 minutes
    max: 100 //Limit each IP to 100 requests per window
}));

// --- Routes ---
app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
});

/*
* GET /products
* Query params:
* - category (slug)
* - sort (price/createdAt/rating)
* - order(asc/dsc)
* - page, pageSize
*/
app.get("/products", async (req, res, next) => {
    try {
        const { category, sort = "createdAt", order = "desc", page = 1, pageSize = 10 } = req.query;
        const where = {};
        if (category) {
            where.category = { slug: String(category) };
        }
        const products = await prisma.product.findMany({
            where,
            orderBy: { [String(sort)]: order === 'asc' ? 'asc' : 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
        });
        res.json(products);
    } catch (error) {
        next(error);
    }
});

//Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
});

//Start server
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});