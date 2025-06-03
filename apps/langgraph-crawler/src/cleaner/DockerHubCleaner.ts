// https://hub.docker.com/v2/repositories/library/python/

import { HTMLCleaner } from "./HTMLCleaner.js";

export class DockerHubCleaner extends HTMLCleaner {
    constructor(html: string, originUrl: string) {
        super(html, originUrl);
    }
    isMatch(url: string): boolean {
        return url.includes("hub.docker.com/r") || url.includes("hub.docker.com/_");
    }
    async getCleanContent() {
        // https://hub.docker.com/r/oven/bun
        const repo = this.originUrl.includes("/r/") ? this.originUrl.split("/r/").pop()! : "library/" + this.originUrl.split("/_/").pop()!;
        const response = await fetch(`https://hub.docker.com/v2/repositories/${repo}`);
        const data = await response.json();
        return {
            content: data.full_description,
            metaData: {
                title: data.name,
                description: data.description + `\nstar: ${data.star_count} pull: ${data.pull_count}`,
                author: data.user,
            },
            isPureMarkdown: true,
        };
    }
}
