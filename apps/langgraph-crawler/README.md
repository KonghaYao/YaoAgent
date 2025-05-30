# LangGraph Crawler

A powerful web crawler designed specifically for LLM applications, capable of extracting clean, readable content from various web pages and converting it to Markdown format.

## Features

- **Smart Content Extraction**: Uses Mozilla's Readability to extract the main content from web pages
- **Specialized Cleaners**:
  - `ReadableCleaner`: General-purpose content extraction for most web pages
  - `WeChatArticleCleaner`: Specialized cleaner for WeChat public articles
- **Markdown Conversion**: Converts HTML content to clean, well-formatted Markdown
- **Character Encoding Support**: Handles various character encodings automatically
- **Customizable Output**: Option to get raw HTML or Markdown format
- **Modern Headers**: Includes proper User-Agent and other headers for better compatibility

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
```

### API

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

## Special Features

### WeChat Article Support

The crawler includes special handling for WeChat public articles:

- Fixes image sources (converts `data-src` to `src`)
- Handles code blocks properly
- Maintains article formatting

### Content Cleaning

The crawler uses a chain of responsibility pattern with specialized cleaners:

1. First tries specialized cleaners (e.g., WeChatArticleCleaner)
2. Falls back to general ReadableCleaner if no specialized cleaner matches

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Apache-2.0
