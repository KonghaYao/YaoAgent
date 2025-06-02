import { SearchEngine, SearchResult } from "../search.js";
import { createCommonHeaders } from "../utils/createCommonHeaders.js";

interface NpmPackage {
    name: string;
    description: string;
    version: string;
    date: {
        ts: number;
        rel: string;
    };
    links: {
        npm: string;
        repository: string;
        homepage: string;
    };
    publisher: {
        name: string;
    };
    maintainers: Array<{
        username: string;
        email: string;
    }>;
    license: string;
    downloads: {
        monthly: number;
        weekly: number;
    };
}

interface NpmSearchResponse {
    objects: Array<{
        package: NpmPackage;
    }>;
    total: number;
}

export const NpmEngine: SearchEngine = {
    name: "npm",
    topic: "code",
    search: async (query) => {
        const url = `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                ...createCommonHeaders(url),
                "x-spiferack": "1",
            },
        });
        const data: NpmSearchResponse = await response.json();
        return data.objects.map(({ package: pkg }) => ({
            title: pkg.name,
            url: pkg.links.npm,
            description: pkg.description,
            updateTime: new Date(pkg.date.ts).toISOString(),
            metadata: {
                version: pkg.version,
                publisher: pkg.publisher.name,
                maintainers: pkg.maintainers.map((m) => m.username),
                license: pkg.license,
                downloads: pkg.downloads,
                repository: pkg.links.repository,
                homepage: pkg.links.homepage,
            },
        }));
    },
};
