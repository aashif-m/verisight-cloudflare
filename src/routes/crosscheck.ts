import { Hono } from "hono";
import { jwt } from "hono/jwt";

type Env = {
    AI: any;
    TAVILY_API_KEY: string;
    JWT_SECRET: string;
}

type reqBody = {
    headline: string;
    body: string;
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
    const { headline, body }: reqBody = await c.req.json();
    let shortenedBody = body.substring(0, 5700);

    const tavilyOptions = {
        "api_key": c.env.TAVILY_API_KEY,
        "query": headline,
        "search_depth": "basic",
        "include_answer": false,
        "include_images": false,
        "include_raw_content": false,
        "max_results": 5,
        "exclude_domains": ['twitter.com', 'facebook.com', 'instagram.com', 'reddit.com', 'x.com']
    };

    const webResults: tavilyResponse = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(tavilyOptions),
    }).then(response => response.json()) as tavilyResponse;

    const getContext = (input: tavilyResponse) => {
        return input.results.map((result) => ({
            role: "system",
            content: `Article title: ${result.title}\nArticle Snippet: ${result.content}`
        }));
    }

    const getSources = (input: tavilyResponse) => {
        const sources = input.results.map((result) => result.url);
        return { sources: sources };
    }

    const context = getContext(webResults);
    const sources = getSources(webResults);

    const messages = [
        ...context,
        {
            role: "system",
            content:
                "You are a helpful assistant that checks if the article has inconsistencies with the sources provided and returns a crosscheck report.",
        },
        {
            role: "user",
            content:
                "The article is about " +
                headline +
                " and the content is " +
                shortenedBody +
                ".",
        },
    ];

    const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {messages});
    c.status(201);
    return c.json({
        ...response,
        ...sources
    });

});

export default app;