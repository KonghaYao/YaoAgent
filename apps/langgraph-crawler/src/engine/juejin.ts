import { SearchEngine, SearchResult } from "../search.js";
import { createCommonHeaders } from "../utils/createCommonHeaders.js";

interface JuejinSearchResult {
    err_no: number;
    err_msg: string;
    data: Array<{
        result_type: number;
        result_model: {
            article_id: string;
            article_info: {
                title: string;
                brief_content: string;
                view_count: number;
                digg_count: number;
                comment_count: number;
                collect_count: number;
                read_time: string;
            };
            author_user_info: {
                user_name: string;
                company: string;
                job_title: string;
            };
            category: {
                category_name: string;
            };
            tags: Array<{
                tag_name: string;
            }>;
        };
        title_highlight: string;
        content_highlight: string;
    }>;
}

export const JuejinEngine: SearchEngine = {
    name: "juejin",
    topic: "code",
    search: async (query) => {
        const params = new URLSearchParams({
            spider: "0",
            query,
            id_type: "0",
            cursor: "0",
            limit: "20",
            search_type: "0",
            sort_type: "0",
            version: "1",
        });

        const url = `https://api.juejin.cn/search_api/v1/search?${params.toString()}`;
        const response = await fetch(url, {
            headers: {
                ...createCommonHeaders(url),
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = (await response.json()) as JuejinSearchResult;

        if (data.err_no !== 0) {
            throw new Error(data.err_msg);
        }

        return data.data.map((item) => ({
            title: item.result_model.article_info.title,
            url: `https://juejin.cn/post/${item.result_model.article_id}`,
            description: item.result_model.article_info.brief_content,
            updateTime: new Date().toISOString(),
            metadata: {
                author: {
                    name: item.result_model.author_user_info.user_name,
                    company: item.result_model.author_user_info.company,
                    job: item.result_model.author_user_info.job_title,
                },
                stats: {
                    views: item.result_model.article_info.view_count,
                    likes: item.result_model.article_info.digg_count,
                    comments: item.result_model.article_info.comment_count,
                    collects: item.result_model.article_info.collect_count,
                    readTime: item.result_model.article_info.read_time,
                },
                category: item.result_model.category.category_name,
                tags: item.result_model.tags.map((tag) => tag.tag_name),
            },
        }));
    },
};
