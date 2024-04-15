import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { Hono } from "hono";
import { jwt } from "hono/jwt";

type Env = {
    DB: D1Database,
    JWT_SECRET: string,
}

type reqBody = {
    link: string;
    username: string;
    note: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET,
    })
    return jwtMiddleware(c, next)
});

app.post("/", async (c) => {
    const { link, note }: reqBody = await c.req.json();
    const payload = c.get('jwtPayload');
    const username = payload.username;
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const article = await prisma.article.findUnique({
        where: {
            link: link,
        },
    });

    if (!article) {
        c.status(404);
        return c.json({ message: "Article not found" });
    }

    const user = await prisma.user.findUnique({
        where: {
            username: username,
        },
    });

    if (!user) {
        c.status(404);
        return c.json({ message: "User not found" });
    }

    const noteExists = await prisma.note.findFirst({
        where: {
            content: note,
        }
    });

    if (noteExists) {
        c.status(400);
        return c.json({ message: "Note already exists" });
    }

    const newNote = await prisma.note.create({
        data: {
            articleId: article.id,
            userId: user.id,
            content: note,
        }
    });

    c.status(201);
    return c.json({ message: "Note added", note: newNote });
});

app.get("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const article = await prisma.article.findUnique({
        where: {
            id: id,
        },
    });

    if (!article) {
        c.status(404);
        return c.json({ message: "Article not found" });
    }

    const notes = await prisma.note.findMany({
        where: {
            articleId: article.id,
        },
        select: {
            id: true,
            content: true,
        },
        orderBy: {
            noteVotes: {
                _count: "desc",
            },
        },
    });

    c.status(200);
    return c.json(notes);
});

app.get("/featured/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });
    const article = await prisma.article.findUnique({
        where: {
            id: id,
        },
    });

    if (!article) {
        c.status(404);
        return c.json({ message: "Article not found" });
    }

    const featuredNote = await prisma.note.findFirst({
        where: {
            articleId: article.id,
        },
        orderBy: {
            noteVotes: {
                _count: "desc",
            },
        }
    });

    c.status(200);
    return c.json(featuredNote);
});

app.get("/user/", async (c) => {
    const payload = c.get('jwtPayload');
    const username = payload.username;
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

    const notes = await prisma.note.findMany({
        where: {
            userId: user.id,
        },
    });

    c.status(200);
    return c.json(notes);
});

app.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const note = await prisma.note.findUnique({
        where: {
            id: id,
        },
    });

    if (!note) {
        c.status(404);
        return c.json({ message: "Note not found" });
    }

    await prisma.note.delete({
        where: {
            id: id,
        },
    });

    c.status(200);
    return c.json({ message: "Note deleted" });
});

app.post("/vote/:id", async (c) => {
    const id = Number(c.req.param("id"));
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const vote = await prisma.noteVote.findFirst({
        where: {
            noteId: id,
            userId: userId,
        }
    });

    if (vote) {
        await prisma.noteVote.delete({
            where: {
                id: vote.id,
            },
        });
        c.status(200);
        return c.json({ message: "Vote removed" });
    }

    const note = await prisma.noteVote.create({
        data: {
            noteId: id,
            userId: username,
        }
    });

    c.status(200);
    return c.json({ message: "Vote added", vote: note });
});

app.get('/isupvoted/:id', async (c) => {
    const id = Number(c.req.param("id"));
    const payload = c.get('jwtPayload');
    const userId = payload.sub;
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    const vote = await prisma.noteVote.findFirst({
        where: {
            noteId: id,
            userId: userId,
        }
    });

    if (vote) {
        c.status(200);
        return c.json({ response: true });
    }

    c.status(200);
    return c.json({ response: false });
});

export default app;