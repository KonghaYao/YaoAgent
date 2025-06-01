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

## Supported Websites

> Note: This list is continuously expanding. Feel free to contribute by adding support for more websites.

### Documentation & Development

- [x] NPM
- [x] Vitepress Base Website
- [x] Github
- [x] DEV Community (dev.to)
- [x] MDN
- [x] Medium
- [x] SearXNG Search Result
- [ ] freeCodeCamp.org
- [ ] Docker Hub
- [ ] StackOverflow
- [ ] Anthropic

### Chinese Platforms

- [x] WeChat Public Articles (微信公众号)
- [x] Juejin (稀土掘金)
- [x] The Paper (澎湃新闻)
- [x] Jiemian (界面新闻)
- [x] Huxiu (虎嗅网)
- [x] UISDC (优设网)
- [x] CNBlogs (博客园)
- [x] SSPAI (少数派)
- [x] InfoQ
- [ ] Zhihu (知乎)

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

```typescript
import { handleRequest } from '@langgraph-js/crawler';

// Create a request object
const request = new Request('http://your-api-endpoint', {
  method: 'POST',
  body: JSON.stringify({
    url: 'https://example.com/article',
    raw: false // Set to true if you want raw HTML instead of Markdown
  })
});

// Handle the request
const response = await handleRequest(request);
const content = await response.text();

// you can use Hono, CloudFlare or Deno.serve like framework to build a server
// Deno.serve(handleRequest);
```

Deno usage is really SIMPLE!!!

```ts
import { handleRequest } from "https://esm.sh/@langgraph-js/crawler";

Deno.serve(handleRequest);
```

### API Reference

The crawler accepts POST requests with the following JSON body:

```typescript
{
  url: string;    // The URL to crawl
  raw?: boolean;  // Optional. If true, returns raw HTML instead of Markdown
}
```

### Response Format

- **Success (200)**: Returns the content in Markdown format (or raw HTML if `raw: true`)
- **Error (400)**: Invalid JSON or URL
- **Error (405)**: Method not allowed (only POST is supported)
- **Error (500)**: Server error with error message

## Advanced Features

### Content Cleaning

The crawler uses a chain of responsibility pattern with specialized cleaners:

1. First tries specialized cleaners (e.g., WeChatArticleCleaner)
2. Falls back to general ReadableCleaner if no specialized cleaner matches

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
