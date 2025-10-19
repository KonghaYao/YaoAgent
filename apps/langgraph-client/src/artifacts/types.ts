import { z } from "zod";
export const ArtifactCommandSchema = {
    command: z.enum(["create", "update", "rewrite"]).describe("The operation to perform: create new artifact, update existing, or rewrite"),
    id: z.string().describe("Unique identifier for the artifact"),
    title: z.string().describe("Human-readable title for the artifact"),
    type: z.string().describe("MIME type of the artifact content (e.g., 'application/vnd.ant.react')"),
    language: z.string().describe("Programming language or format of the content"),
    content: z.string().describe("The actual content to be created or updated. Don't Reply These Code to User, User can see these code in artifacts."),
    old_str: z.string().describe("The existing content to be replaced (for update operations)"),
    new_str: z.string().describe("The new content to replace the old content (for update operations)"),
};
export type ArtifactCommand = z.infer<z.ZodObject<typeof ArtifactCommandSchema>>;
