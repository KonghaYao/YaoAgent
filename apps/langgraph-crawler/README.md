# Crawler for LLM

> A universal web crawler for LLM frameworks, not limited to LangGraph

A powerful web crawler designed specifically for LLM applications, capable of extracting clean, readable content from various web pages and converting it to Markdown format. This tool is essential for building knowledge bases, training data collection, and content aggregation for LLM applications.

> Support Nodejs | Deno | Bun

## Features

- **Smart Content Extraction**: Uses Mozilla's Readability to extract the main content from web pages
- **Specialized Cleaners**:
    - `ReadableCleaner`: General-purpose content extraction for most web pages
    - `WeChatArticleCleaner`: Specialized cleaner for WeChat public articles
- **Markdown Conversion**: Converts HTML content to clean, well-formatted Markdown
- **Character Encoding Support**: Handles various character encodings automatically
- **Customizable Output**: Option to get raw HTML or Markdown format
- **Modern Headers**: Includes proper User-Agent and other headers for better compatibility
- **SEO MetaData Support**: Extracts and preserves important metadata
- **Error Handling**: Robust error handling and retry mechanisms
- **Rate Limiting**: Built-in rate limiting to prevent overloading target servers
- **Search Engine Integration**: Support for multiple search engines (SearXNG, Juejin, etc.)

## Supported Websites

> Note: This list is continuously expanding. Feel free to contribute by adding support for more websites.

### Documentation & Development

| WeiSite                | Extract | Search |
| ---------------------- | ------- | ------ |
| NPM                    | ✅      | ✅     |
| Vitepress Base Website | ✅      | ❌     |
| Github                 | ✅      | ✅     |
| DEV Community (dev.to) | ✅      | ❌     |
| MDN                    | ✅      | ❌     |
| Medium                 | ✅      | ❌     |
| SearXNG Search Result  | ✅      | ✅     |
| freeCodeCamp.org       | ✅      | ❌     |
| Docker Hub             | ✅      | ❌     |
| StackOverflow          | ❌      | ❌     |
| Anthropic              | ✅      | ✅     |

### Chinese Platforms

| WeiSite    | Extract | Search |
| ---------- | ------- | ------ |
| 微信公众号 | ✅      | ❌     |
| 稀土掘金   | ✅      | ✅     |
| 澎湃新闻   | ✅      | ❌     |
| 界面新闻   | ✅      | ❌     |
| 虎嗅网     | ✅      | ❌     |
| 优设网     | ✅      | ❌     |
| 博客园     | ✅      | ❌     |
| 少数派     | ✅      | ❌     |
| InfoQ      | ✅      | ❌     |
| CSDN       | ✅      | ❌     |
| 知乎       | ❌      | ❌     |

## Installation

```bash
npm install @langgraph-js/crawler
# or
yarn add @langgraph-js/crawler
# or
pnpm add @langgraph-js/crawler
```

## Usage

### Basic Usage

#### Content Extraction

```typescript
import { handleExtractRequest, extract } from "@langgraph-js/crawler";

// 方式 1: 使用 HTTP 请求处理
const request = new Request("http://your-api-endpoint", {
    method: "POST",
    body: JSON.stringify({
        url: "https://example.com/article",
        raw: false, // Set to true if you want raw HTML instead of Markdown
    }),
});

// Handle the request
const response = await handleExtractRequest(request);
const content = await response.text();

// 方式 2: 直接使用 extract 函数
const content = await extract({
    url: "https://example.com/article",
    raw: false,
});
```

#### Search Functionality

```typescript
import { handleSearchRequest, search } from "@langgraph-js/crawler";

// 方式 1: 使用 HTTP 请求处理
const request = new Request("http://your-api-endpoint", {
    method: "POST",
    body: JSON.stringify({
        query: "your search query",
        topic: "code", // 'news' or 'code'
        engines: ["basic", "juejin"], // specify which search engines to use
        format: "markdown", // 'json' or 'markdown'
    }),
});

// Handle the search request
const response = await handleSearchRequest(request);
const results = await response.text();

// 方式 2: 直接使用 search 函数
const results = await search({
    query: "your search query",
    engines: ["basic", "juejin"],
    format: "markdown",
});
```

### Deno Usage

```ts
import { handleExtractRequest, handleSearchRequest } from "https://esm.sh/@langgraph-js/crawler";
import { Hono } from "https://esm.sh/hono";

const app = new Hono();

app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
Deno.serve(app.fetch);
```

### API Reference

#### Content Extraction API

The crawler accepts POST requests with the following JSON body:

```typescript
{
  url: string;    // The URL to crawl
  raw?: boolean;  // Optional. If true, returns raw HTML instead of Markdown
}
```

#### Search API

The search API accepts POST requests with the following JSON body:

```typescript
{
  query: string;           // The search query
  engines?: string[];      // Optional. Array of engine names to use， "basic","npm", "juejin"
  format?: 'json' | 'markdown'; // Optional. Defaults to 'json'
}
```

### Response Format

#### Content Extraction

- **Success (200)**: Returns the content in Markdown format (or raw HTML if `raw: true`)
- **Error (400)**: Invalid JSON or URL
- **Error (405)**: Method not allowed (only POST is supported)
- **Error (500)**: Server error with error message

#### Search Results

- **JSON Format**:

```typescript
{
    engine: string;
    results: Array<{
        title: string;
        url: string;
        description: string;
        updateTime: string;
        metadata?: Record<string, any>;
    }>;
}
[];
```

- **Markdown Format**:

```markdown
## [Title](URL)

Description

### Metadata

- Author: Name (Company, Job)
- Stats: Views, Likes, Comments, Collects
- Category: Category
- Tags: Tag1, Tag2, ...

---
```

## Advanced Features

### Content Cleaning

The crawler uses a chain of responsibility pattern with specialized cleaners:

1. First tries specialized cleaners (e.g., WeChatArticleCleaner)
2. Falls back to general ReadableCleaner if no specialized cleaner matches

### Search Engines

Currently supported search engines:

- `basic`: SearXNG-based general search
- `juejin`: Juejin technical articles search
- `npm`: NPM package search
- More engines coming soon...

### Performance Considerations

- Implements caching mechanisms to prevent redundant requests
- Supports concurrent requests with configurable limits
- Optimized for large-scale crawling operations

## Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the project
pnpm build
```

## License

Apache-2.0

## Support

If you encounter any issues or have questions, please:

1. Check the [existing issues](https://github.com/your-repo/issues)
2. Create a new issue if your problem isn't already reported
3. Join our community chat for real-time support
