import { Hono } from "hono";
import { jwt } from "hono/jwt";
import OpenAI from "openai";

type Env = {
    AI: any;
    JWT_SECRET: string;
    AZURE_OPENAI_API_KEY: string;
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
                `Given a news headline and its corresponding body text, return one of the following values in json format:

          1. "congruent" - if the body text is congruent with the headline.
          2. "incongruent" - if the body text is incongruent with the headline.
          `,
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + shortenedBody,
        }];

    // const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", { messages });
    // const responseString = String(response);
    // let result = responseString.includes("incongruent") ? "incongruent" : "congruent";

    // Back to OpenAI :)
    const resource = 'verisightgptapi'; //without the .openai.azure.com
    const model = 'Verisight-gpt35-turbo-1106';
    const apiVersion = '2024-02-15-preview';
    const apiKey = c.env.AZURE_OPENAI_API_KEY;

    const azure_openai = new OpenAI({
        apiKey: apiKey,
        baseURL: `https://gateway.ai.cloudflare.com/v1/242f6efe1a95baaf1fbdfef2f3d0654c/summary/azure-openai/${resource}/${model}`,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: { 'api-key': apiKey },
    });

    const completion = await azure_openai.chat.completions.create({
        messages: messages,
        model: model,
        response_format: { type: "json_object" }
    });

    // parse json from completion 
    const { result } = JSON.parse(completion.choices[0].message.content);

    c.status(201);
    return c.json({
        response: result
    });
});

export default app;