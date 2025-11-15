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
            return new Response(JSON.stringify({ detail: { error: "Invalid JSON" } }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        json;
        const validation = ExtractSchema.safeParse(json);
        if (!validation.success) {
            return new Response(JSON.stringify({ detail: { error: validation.error.message } }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            const response = await extract(json);
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ detail: { error: (error as Error).message } }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
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
            return new Response(JSON.stringify({ detail: { error: "Invalid JSON" } }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }
        const { success, data, error } = SearchSchema.safeParse(json);
        if (!success) {
            return new Response(JSON.stringify({ detail: { error: error.message } }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            const response = await search(data);
            return new Response(JSON.stringify(response), {
                status: 200,
                headers: { "Content-Type": "application/json" }
            });
        } catch (error) {
            console.error(error);
            return new Response(JSON.stringify({ detail: { error: (error as Error).message } }), {
                status: 500,
                headers: { "Content-Type": "application/json" }
            });
        }
    } else {
        return new Response("Method not allowed", { status: 405 });
    }
}

export { handleExtractRequest as handleRequest, handleExtractRequest, handleSearchRequest };
