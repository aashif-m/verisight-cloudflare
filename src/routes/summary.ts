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
    const {headline, body} : reqBody = await c.req.json();

    const messages = [
        {
            role: "system",
            content: "Given a news headline and body, return a summary of the news. Make sure not to have any prefix."
        },
        {
            role: "user",
            content: "Headline: " + headline + "\nBody: " + body
        },
    ];


    // Disabled Cloudflare AI until higher context limits are announced
    // const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {messages});

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
    model: model
    });

    const summary = completion.choices[0].message.content;
    
    c.status(201);
    return c.json({
        response: summary
    });

})

export default app;