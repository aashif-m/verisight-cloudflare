import { Hono } from "hono";
import { Ai } from '@cloudflare/ai'

type Env = {
    AI: any;
}

type reqBody = {
    headline: string;
    body: string;
}

const summary = new Hono<{ Bindings: Env }>();

summary.post("/", async (c) => {
    const {headline, body} : reqBody = await c.req.json();

    const ai = new Ai(c.env.AI);

    const messages = [
        {
            role: "system",
            content: "Given a news headline and body, return a summary of the news."
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + body
        },
    ];


    const response = await ai.run("@hf/thebloke/openhermes-2.5-mistral-7b-awq", {messages});
    c.status(201);
    return c.json(response);

})

export default summary;