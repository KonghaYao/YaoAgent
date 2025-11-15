# Crawler for LLM

> A universal web crawler for LLM frameworks, not limited to LangGraph
> **Tavily API Compatible** - Drop-in replacement for Tavily Extract and Search APIs

A powerful web crawler designed specifically for LLM applications, capable of extracting clean, readable content from various web pages and converting it to Markdown format. This tool is essential for building knowledge bases, training data collection, and content aggregation for LLM applications.

The search functionality is fully compatible with [Tavily Search API](https://docs.tavily.com/api-reference/endpoint/search), allowing seamless integration and migration.

> Support Nodejs | Deno | Bun | Hono.js | MCP

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
- **Tavily API Compatibility**: Drop-in replacement for Tavily Extract and Search APIs
- **MCP Protocol Support**: Full Model Context Protocol integration with tavily-search and tavily-extract tools
- **Hono.js Framework Integration**: Ready-to-use Hono.js application with built-in endpoints
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
        urls: "https://example.com/article",
        format: "markdown", // 'markdown' or 'text'
        include_images: false,
        extract_depth: "basic",
    }),
});

// Handle the request
const response = await handleExtractRequest(request);
const data = await response.json();

// 方式 2: 直接使用 extract 函数
const data = await extract({
    urls: "https://example.com/article",
    format: "markdown",
    include_images: false,
    extract_depth: "basic",
});
```

#### Search Functionality (Tavily Compatible)

```typescript
import { handleSearchRequest, search } from "@langgraph-js/crawler";

// 方式 1: 使用 HTTP 请求处理
const request = new Request("http://your-api-endpoint", {
    method: "POST",
    body: JSON.stringify({
        query: "your search query",
        topic: "general", // 'general', 'news', 'finance'
        search_depth: "basic", // 'basic' or 'advanced'
        max_results: 5,
        include_answer: true, // include AI-generated answer
        include_raw_content: true, // include cleaned HTML content
    }),
});

// Handle the search request
const response = await handleSearchRequest(request);
const results = await response.json();

// 方式 2: 直接使用 search 函数
const results = await search({
    query: "your search query",
    topic: "general",
    search_depth: "basic",
    max_results: 5,
    include_answer: true,
    include_raw_content: true,
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

### Hono.js Quick Start

For rapid deployment with Hono.js framework and MCP protocol support:

```typescript
import app from "@langgraph-js/crawler/hono";

// Quick start with all endpoints enabled
// - POST /extract: Content extraction endpoint
// - POST /search: Search functionality endpoint
// - GET /favicon/:domain: Favicon retrieval
// - ALL /mcp: MCP protocol endpoint for AI agent integration

export default app;
```

Or create a custom Hono.js application:

```typescript
import { Hono } from "hono";
import { handleExtractRequest, handleSearchRequest, handleFavicon } from "@langgraph-js/crawler";
import { cors } from "hono/cors";

const app = new Hono();

// Add CORS support
app.use(cors());

// Content extraction endpoint
app.post("/extract", (c) => handleExtractRequest(c.req.raw));

// Search endpoint
app.post("/search", (c) => handleSearchRequest(c.req.raw));

// Favicon endpoint
app.get("/favicon/:domain", (c) => handleFavicon(c.req.raw));

export default app;
```

#### MCP Protocol Integration

The Hono.js adapter includes full MCP (Model Context Protocol) support:

```typescript
import app from "@langgraph-js/crawler/hono";

// The /mcp endpoint provides:
// - tavily-search tool: Real-time web search with customizable parameters
// - tavily-extract tool: Content extraction from URLs with advanced parsing

// Start your server
export default app;
```

MCP tools available:

- **tavily-search**: Web search with depth control, domain filtering, and time-based filtering
- **tavily-extract**: Content extraction with basic/advanced modes and format options

#### Standalone MCP Server

For direct MCP integration without Hono.js framework:

```typescript
import { mcpServer } from "@langgraph-js/crawler/mcp";

// The mcpServer provides the same tavily-search and tavily-extract tools
// Connect it to your preferred MCP transport layer

export { mcpServer };
```

### API Reference

#### Content Extraction API (Tavily Compatible)

The extract API accepts POST requests with the following JSON body (compatible with Tavily Extract API):

```typescript
{
  urls: string | string[];          // The URL(s) to extract content from
  include_images?: boolean;         // Include extracted images (default: false)
  include_favicon?: boolean;        // Include favicon URL (default: false)
  extract_depth?: 'basic' | 'advanced'; // Extraction depth (default: 'basic')
  format?: 'markdown' | 'text';     // Output format (default: 'markdown')
  timeout?: number;                 // Timeout in seconds (1-60)
}
```

#### Search API (Tavily Compatible)

The search API accepts POST requests with the following JSON body (compatible with Tavily Search API):

```typescript
{
  query: string;                    // The search query to execute
  auto_parameters?: boolean;        // Auto-configure search parameters
  topic?: 'general' | 'news' | 'finance'; // Search category (default: 'general')
  search_depth?: 'basic' | 'advanced'; // Search depth (default: 'basic')
  chunks_per_source?: number;       // Chunks per source (1-3, default: 3)
  max_results?: number;             // Max results (0-20, default: 5)
  time_range?: 'day' | 'week' | 'month' | 'year'; // Time filter
  start_date?: string;              // Start date (YYYY-MM-DD)
  end_date?: string;                // End date (YYYY-MM-DD)
  include_answer?: boolean | 'basic' | 'advanced'; // Include AI answer
  include_raw_content?: boolean | 'markdown' | 'text'; // Include raw content
  include_images?: boolean;         // Include images
  include_image_descriptions?: boolean; // Include image descriptions
  include_favicon?: boolean;        // Include favicons
  include_domains?: string[];       // Include specific domains
  exclude_domains?: string[];       // Exclude specific domains
  country?: string;                 // Country filter
}
```

### Response Format

#### Content Extraction (Tavily Compatible)

Returns a JSON response compatible with Tavily Extract API:

```typescript
{
    results: Array<{
        url: string;
        raw_content: string; // Extracted content (markdown or text)
        images?: string[]; // Images (if requested)
        favicon?: string; // Favicon URL (if requested)
    }>;
    failed_results: Array<{
        url: string;
        error: string; // Error message for failed extractions
    }>;
    response_time: number; // Response time in seconds
    request_id: string; // Unique request identifier
}
```

- **Success (200)**: Returns JSON with extracted content
- **Error (400)**: Invalid JSON, URL, or parameters
- **Error (405)**: Method not allowed (only POST is supported)
- **Error (500)**: Server error with error message

#### Search Results (Tavily Compatible)

Returns a JSON response compatible with Tavily Search API:

```typescript
{
  query: string;                    // The executed search query
  answer?: string;                  // AI-generated answer (if requested)
  images?: Array<{                  // Images (if requested)
    url: string;
    description?: string;
  }>;
  results: Array<{                  // Search results
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
    favicon?: string;
  }>;
  auto_parameters?: object;         // Auto parameters (if used)
  response_time: number;            // Response time in seconds
  request_id: string;               // Unique request identifier
}
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

### AI Agent Integration

The crawler provides seamless integration with AI agents through the Model Context Protocol:

- **Standardized Tool Interface**: MCP-compatible tools for search and extraction
- **Streaming Support**: Real-time data streaming via HTTP transport
- **Agent-Friendly**: Designed for integration with LLM frameworks and AI assistants
- **Extensible Architecture**: Easy to add new MCP tools and capabilities

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
