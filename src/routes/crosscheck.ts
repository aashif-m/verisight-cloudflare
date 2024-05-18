import { Hono } from "hono";
import { jwt } from "hono/jwt";
import OpenAI from "openai";

type Env = {
    AI: any;
    TAVILY_API_KEY: string;
    JWT_SECRET: string;
    AZURE_OPENAI_API_KEY: string;
}

type reqBody = {
    headline: string;
    body: string;
    url: string;
}

type tavilyResponse = {
    query: string;
    results: {
        title: string;
        url: string;
        content: string;
    }[];
};

const app = new Hono<{ Bindings: Env }>();

app.use('/*', (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET,
    })
    return jwtMiddleware(c, next)
})

app.post("/", async (c) => {
    const { headline, body, url }: reqBody = await c.req.json();
    const urlHostname = new URL(url).hostname;

    const tavilyOptions = {
        "api_key": c.env.TAVILY_API_KEY,
        "query": headline,
        "search_depth": "basic",
        "include_answer": false,
        "include_images": false,
        "include_raw_content": false,
        "max_results": 3,
        "exclude_domains": ['twitter.com', 'facebook.com', 'instagram.com', 'reddit.com', 'x.com', 'youtube.com', urlHostname],
    };

    const webResults: tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tavilyOptions),
    }).then(response => response.json()) as tavilyResponse;

    console.log(webResults);

    const getContext = (input: tavilyResponse) => {
        const context = input.results.map((result) => `Article title: ${result.title}\nArticle Snippet: ${result.content}`).join('\n');
        return context;
    }

    const getSources = (input: tavilyResponse) => {
        const sources = input.results.map((result) => result.url);
        return { sources: sources };
    }

    const context = getContext(webResults);
    const sources = getSources(webResults);

    const messages = [
        {
            role: "system",
            content: context + "You are a helpful assistant that checks if the article has inconsistencies with the sources provided and returns a crosscheck report.",
        },
        {
            role: "user",
            content: "Context from other sources: \n" + context + "The article you are checking is: \nHeadline: " + headline + "\nBody: " + body + "\n\nPlease crosscheck the article with the sources provided.",
        },
    ];

    // Disabling cloudflare AI until higher context limits are announced
    // const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {messages});

    // Back to OpenAI :)
    const resource = 'verisightgptapi'; //without the .openai.azure.com
    const model = 'Verisight-gpt35-turbo-1106';
    const apiVersion = '2024-02-15-preview';
    const apiKey = c.env.AZURE_OPENAI_API_KEY;


    const azure_openai = new OpenAI({
        apiKey: apiKey,
        baseURL: `https://gateway.ai.cloudflare.com/v1/242f6efe1a95baaf1fbdfef2f3d0654c/crosscheck/azure-openai/${resource}/${model}`,
        defaultQuery: { 'api-version': apiVersion },
        defaultHeaders: { 'api-key': apiKey },
    });

    const completion = await azure_openai.chat.completions.create({
        messages: messages,
        model: model
    });

    const crosscheck = completion.choices[0].message.content;

    c.status(201);
    return c.json({
        response: crosscheck,
        ...sources
    });

});

export default app;