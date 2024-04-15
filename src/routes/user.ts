import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@prisma/client";
import { Hono } from "hono";
import { jwt } from "hono/jwt";
import { hashPassword, verifyPassword } from "../utils/password";

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

app.patch("/password", async (c) => {
    const payload = c.get('jwtPayload');
    const { currentPassword, newPassword } = await c.req.json();
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const user = await prisma.user.findUnique({
        where: {
            id: payload.sub,
        },
    });

    if (!user) {
        c.status(404);
        return c.json({ message: "User not found" });
    }

    const currentPasswordHash = user.password;

    const passwordValid = await verifyPassword(currentPasswordHash, currentPassword);
    if (!passwordValid) {
        c.status(401);
        return c.json({ message: "Invalid password" });
    }

    const newHashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
        where: {
            id: payload.sub,
        },
        data: {
            password: newHashedPassword,
        },
    });

    c.status(204);
    return c.json({ message: "Password updated" });
});

app.delete("/", async (c) => {
    const payload = c.get('jwtPayload');
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    await prisma.user.delete({
        where: {
            id: payload.sub,
        },
    });

    await prisma.note.deleteMany({
        where: {
            userId: payload.sub,
        },
    });

    await prisma.noteVote.deleteMany({
        where: {
            userId: payload.sub,
        },
    });

    c.status(204);
    return c.json({ message: "User deleted" });
});

export default app;
