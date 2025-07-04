import { ExtractSchema } from "./extract.js";
import { extract } from "./extract.js";
import { search, SearchSchema } from "./search.js";
export * from "./extract.js";
export * from "./search.js";
export * from "./favicons.js";

async function handleExtractRequest(req: Request): Promise<Response> {
    if (req.method === "POST") {
        let json;
        try {
            json = await req.json();
        } catch (_) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
            });
        }

        if (!ExtractSchema.safeParse(json).success) {
            return new Response(JSON.stringify({ error: "Invalid URL" }), {
                status: 400,
            });
        }

        try {
            const content = await extract(json);
            return new Response(content, { status: 200 });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: (error as Error).message }), {
                status: 500,
            });
        }
    } else {
        return new Response("Method not allowed", { status: 405 });
    }
}
async function handleSearchRequest(req: Request): Promise<Response> {
    if (req.method === "POST") {
        let json;
        try {
            json = await req.json();
        } catch (_) {
            return new Response(JSON.stringify({ error: "Invalid JSON" }), {
                status: 400,
            });
        }
        const { success, data, error } = SearchSchema.safeParse(json);
        if (!success) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 400,
            });
        }

        try {
            const content = await search(data);
            if (typeof content === "string") {
                return new Response(content, { status: 200, headers: { "Content-Type": "text/markdown" } });
            } else {
                return new Response(JSON.stringify(content), { status: 200, headers: { "Content-Type": "application/json" } });
            }
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ error: (error as Error).message }), {
                status: 500,
            });
        }
    } else {
        return new Response("Method not allowed", { status: 405 });
    }
}

export { handleExtractRequest as handleRequest, handleExtractRequest, handleSearchRequest };
