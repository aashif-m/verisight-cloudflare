import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { hashPassword } from "../utils/password";

type Env = {
    DB: D1Database,
    JWT_SECRET: string,
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET,
    })
    return jwtMiddleware(c, next)
})

app.put("/password", async (c) => {
    const payload = c.get('jwtPayload');
    const { password } = await c.req.json();
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
        where: {
            id: payload.sub,
        },
        data: {
            password: hashedPassword,
        },
    });

    c.status(204);
    return c.json({ message: "Password updated" });
});

export default app;
