#!/usr/bin/env node
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import express from "express";
import crawlAgent from "./crawlAgent.js";
import FileSystem from "./filesystem.js";
import npmBot from "./npmAgent.js";
import openSourceBot from "./opensource.js";
import "dotenv/config";
import { context } from "./context.js";
const app = express();

const transportStore = new Map<string, SSEServerTransport>();
const appMap = new Map<string, McpServer | Server>([
    ["crawl_bot", crawlAgent],
    ["filesystem_bot", FileSystem],
    ["npm_bot", npmBot],
    ["opensource_bot", openSourceBot],
]);

app.get(`/:name/sse`, async (req, res) => {
    const appName = req.params.name;

    if (!appMap.has(appName)) {
        res.status(404).send("App not found");
        return;
    }

    if (transportStore.has(appName)) {
        const transport = transportStore.get(appName);
        transport!.close();
    }

    console.log(`Connected to ${appName}`);
    const port = new SSEServerTransport(`/${appName}/message`, res);

    transportStore.set(appName, port);
    if (port.sessionId) {
        context[port.sessionId] = req.headers;
    }
    await appMap.get(appName)!.connect(port);
});

app.post(`/:name/message`, async (req, res) => {
    const appName = req.params.name;
    if (!appMap.has(appName)) {
        res.status(404).send("App not found");
        return;
    }
    const transport = transportStore.get(appName);
    console.log(`Sent message to ${appName}`);
    if (transport) {
        context[transport.sessionId] = req.headers;
        await transport.handlePostMessage(req, res);
    }
});

app.listen(6798);
