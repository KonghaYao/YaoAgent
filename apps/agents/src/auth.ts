import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";

const verifyToken = async (token: string): Promise<string> => {
    const hashToken = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    return Array.from(new Uint8Array(hashToken))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
};

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        const authorization = request.headers.get("authorization");
        const token = authorization?.split(" ").at(-1);

        try {
            const userId = (await verifyToken(token!)) as string;
            return { identity: userId, permissions: [], cookies: request.headers.get("cookies") };
        } catch (error) {
            throw new HTTPException(401, { message: "Invalid token", cause: error });
        }
    })
    .on("*", ({ value, user, event }) => {
        // Add owner to the resource metadata
        if ("metadata" in value) {
            value.metadata ??= {};
            value.metadata.owner = user.identity;
        }
        // 用户可以查看自己的 assistant
        if (event === "assistants:search") {
            return;
        }
        // Filter the resource by the owner
        return { owner: user.identity };
    })
    .on("store", ({ user, value }) => {
        if (value.namespace != null) {
            // Assuming you organize information in store like (user_id, resource_type, resource_id)
            const [userId] = value.namespace;
            if (userId !== user.identity) {
                throw new HTTPException(403, { message: "Not authorized" });
            }
        }
    });
