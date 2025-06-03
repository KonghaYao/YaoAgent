import { createCommonHeaders } from "../utils/createCommonHeaders.js";
import { SearchEngine, SearchResult } from "../search.js";

export const AnthropicEngine: SearchEngine = {
    name: "anthropic",
    topic: "docs",
    search: async (query) => {
        const response = await fetch("https://api.inkeep.com/graphql", {
            headers: {
                authorization: "Bearer 8f9c3d77d99a05677fd5bdf7a1f4fc1a6e65ce12aabe65cf",

                ...createCommonHeaders("https://docs.anthropic.com/en/docs/get-started"),
                "content-type": "application/json",
            },
            body: JSON.stringify({
                query: "query GetSearchResults($searchInput: SearchInput!) {\n  search(searchInput: $searchInput) {\n    searchHits {\n      id\n      hitOnRoot\n      url\n      title\n      preview\n\n      ... on DocumentationHit {\n        rootRecord {\n          __typename\n          id\n          title\n          url\n          preview\n          ... on DocumentationRecord {\n            pathBreadcrumbs\n            contentType\n            topLevelHeadings {\n              anchor\n              url\n              content\n            }\n          }\n        }\n        pathHeadings {\n          anchor\n          content\n        }\n        content {\n          anchor\n          content\n        }\n      }\n\n      ... on StackOverflowHit {\n        rootRecord {\n          __typename\n          id\n          title\n          url\n          preview\n          ... on StackOverflowRecord {\n            body\n            createdAt\n\n            markedAsCorrectAnswer {\n              url\n              score\n              content\n            }\n          }\n        }\n      }\n\n      ... on GitHubIssueHit {\n        rootRecord {\n          __typename\n          id\n          title\n          url\n          preview\n          ... on GitHubIssueRecord {\n            createdAt\n            body\n            state\n          }\n        }\n      }\n\n      ... on DiscourseHit {\n        rootRecord {\n          __typename\n          id\n          title\n          url\n          preview\n          ... on DiscourseRecord {\n            createdAt\n            body\n          }\n        }\n      }\n    }\n    searchQuery\n  }\n}\n",
                variables: {
                    searchInput: {
                        searchQuery: query,
                        filters: {
                            limit: 10,
                        },
                    },
                },
            }),
            method: "POST",
            mode: "cors",
            credentials: "include",
        });
        const data = await response.json();

        // console.log(data);
        // 转换搜索结果
        if (data?.data?.search?.searchHits && Array.isArray(data.data.search.searchHits)) {
            return data.data.search.searchHits.map((hit: any): SearchResult => {
                const description = hit.preview || (hit.content?.content ? hit.content.content.substring(0, 200) + "..." : "");

                // 获取更新时间，如果没有则使用当前日期
                const updateTime = hit.rootRecord?.createdAt || new Date().toISOString();

                // 构建元数据
                const metadata: Record<string, any> = {
                    source: "anthropic",
                    id: hit.id,
                    hitOnRoot: hit.hitOnRoot,
                };

                // 如果有rootRecord，添加其他元数据
                if (hit.rootRecord) {
                    if (hit.rootRecord.pathBreadcrumbs) {
                        metadata.breadcrumbs = hit.rootRecord.pathBreadcrumbs;
                    }
                    if (hit.rootRecord.contentType) {
                        metadata.contentType = hit.rootRecord.contentType;
                    }
                    if (hit.rootRecord.topLevelHeadings) {
                        metadata.headings = hit.rootRecord.topLevelHeadings.map((h: any) => h.content);
                    }
                }

                // 如果有content字段，添加内容摘要
                if (hit.content && hit.content.content) {
                    metadata.contentSummary = hit.content.content.substring(0, 500);
                }

                return {
                    title: hit.title || "无标题",
                    url: hit.url,
                    description: description,
                    updateTime: updateTime,
                    metadata: metadata,
                };
            });
        }

        return [];
    },
};
