import { Auth, HTTPException } from "@langchain/langgraph-sdk/auth";

export const auth = new Auth()
    .authenticate(async (request: Request) => {
        const authorization = request.headers.get("authorization");
        const token = authorization?.split(" ").at(-1);

        try {
            // const userId = (await verifyToken(token)) as string;
            const userId = "222111";
            return { identity: userId, permissions: [], cookies: request.headers.get("cookies") };
        } catch (error) {
            throw new HTTPException(401, { message: "Invalid token", cause: error });
        }
    })
    .on("*", ({ value, user }) => {
        // Add owner to the resource metadata
        if ("metadata" in value) {
            value.metadata ??= {};
            value.metadata.owner = user.identity;
        }

        // Filter the resource by the owner
        return { owner: user.identity };
    })
    .on("store", ({ user, value }) => {
        if (value.namespace != null) {
            // Assuming you organize information in store like (user_id, resource_type, resource_id)
            const [userId, resourceType, resourceId] = value.namespace;
            if (userId !== user.identity) {
                throw new HTTPException(403, { message: "Not authorized" });
            }
        }
    });
