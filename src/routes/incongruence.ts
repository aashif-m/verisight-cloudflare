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
    let shortenedBody = body.substring(0, 5700);

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
            content: "Headline: " + headline + "\nBody: " + shortenedBody,
        }];

    const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", { messages });
    const responseString = String(response);
    let result = responseString.includes("incongruent") ? "incongruent" : "congruent";
    c.status(201);
    return c.json({response: result});
});

export default app;