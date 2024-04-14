import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { Hono } from "hono";

type Env = {
    DB: D1Database;
}

type reqBody = {
    title: string,
    link: string,
    publishedTime: string
}

const app = new Hono<{ Bindings: Env }>();

app.put("/", async (c) => {
    const { title, link, publishedTime }: reqBody = await c.req.json();
    const adapter = new PrismaD1(c.env.DB);
    const prisma = new PrismaClient({ adapter });

    let article = await prisma.article.findUnique({ where: { link } });
    //cast publishedTime to Date and time format
    let publishedTimeDate = new Date(publishedTime);

    if (!article) {
        article = await prisma.article.create({
            data: {
                title: title,
                link: link,
                publishedTime: publishedTimeDate
            }
        });
    } else {
        article = await prisma.article.update({
            where: { link },
            data: {
                title: title,
                link: link,
                publishedTime: publishedTime
            }
        });
    }

    c.status(200);
    return c.json({ message: "Article added", article: article });
});

app.get("/whitelist", async (c) => {
    const whitelist = ["www.bbc.com", "www.dailymirror.lk"];

    c.status(200);
    return c.json({ whitelist });
});

export default app;