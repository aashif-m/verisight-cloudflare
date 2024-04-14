import { Ai } from "@cloudflare/ai";
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
    const { headline, body }: reqBody = await c.req.json();

    const ai = new Ai(c.env.AI);

    const messages = [
        {
            role: "system",
            content:
                `Given a news headline and its corresponding body text, return one of the following values:

          1. "congruent" - if the body text is congruent with the headline.
          2. "incongruent" - if the body text is incongruent with the headline.
          
          Remember, your response should only be the value: "congruent" or "incongruent", without any additional information or analysis.`,
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + body,
        }];

    const response = await ai.run("@hf/thebloke/openhermes-2.5-mistral-7b-awq", { messages });
    c.status(201);
    return c.json(response);
});

export default app;