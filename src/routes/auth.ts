import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import * as jwt from 'hono/jwt'
import { hashPassword, verifyPassword } from "../utils/password";

type Env = {
    DB: D1Database;
    JWT_SECRET: string;
}

const app = new Hono<{ Bindings: Env }>();

app.post("/register", async (c) => {
    const { username, password } = await c.req.json();
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const hashedPassword = await hashPassword(password);

    if (await prisma.user.findUnique({ where: { username: username } })) {
        c.status(409);
        return c.json({ message: "User already exists" });
    }

    const user = await prisma.user.create({
        data: {
            username: username,
            password: hashedPassword,
        }
    });

    c.status(201);
    return c.json({ message: "User registered" });
});

app.post("/login", async (c) => {
    const { username, password } = await c.req.json();
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });

    if (!user) {
        c.status(404);
        return c.json({ message: "User not found" });
    }

    const passwordValid = await verifyPassword(user.password, password);

    if (!passwordValid) {
        c.status(401);
        return c.json({ message: "Invalid password" });
    }

    const payload = {
        sub: user.id,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    };
    
    const token = await jwt.sign(payload, c.env.JWT_SECRET);

    c.status(200);
    return c.json({ message: "Logged in", token });
});

export default app;