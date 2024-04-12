import { Ai } from "@cloudflare/ai";
import { Hono } from "hono";

type Env = {
    AI: any;
}

type reqBody = {
    headline: string;
    body: string;
}

const incongruence = new Hono<{ Bindings: Env }>();

incongruence.post("/", async (c) => {
    const { headline, body }: reqBody = await c.req.json();

    const ai = new Ai(c.env.AI);

    const messages = [
        {
            role: "system",
            content:
                `Given a news headline and its corresponding body text, return one of the following values:

          1. "consistent" - if the body text is consistent with the headline.
          2. "inconsistent" - if the body text is inconsistent with the headline.
          
          Remember, your response should only be the value: "consistent" or "inconsistent", without any additional information or analysis.`,
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + body,
        }];

    const response = await ai.run("@hf/thebloke/openhermes-2.5-mistral-7b-awq", { messages });
    c.status(201);
    return c.json(response);
});

export default incongruence;