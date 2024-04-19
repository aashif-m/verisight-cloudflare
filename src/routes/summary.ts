import { Hono } from "hono";
import { jwt } from "hono/jwt";

type Env = {
    AI: any;
    JWT_SECRET: string;
}

type reqBody = {
    headline: string;
    body: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use('/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET,
    })
    return jwtMiddleware(c, next)
})

app.post("/", async (c) => {
    const {headline, body} : reqBody = await c.req.json();
    let shortenedBody = body.substring(0, 5700);

    const messages = [
        {
            role: "system",
            content: "Given a news headline and body, return a summary of the news."
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + shortenedBody
        },
    ];


    const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {messages});
    c.status(201);
    return c.json(response);

})

export default app;