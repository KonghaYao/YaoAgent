# Crawler for LLM with MCP Support

> A universal web crawler for LLM frameworks with Model Context Protocol (MCP) integration

A powerful web crawler designed specifically for LLM applications, capable of extracting clean, readable content from various web pages and converting it to Markdown format. This tool is essential for building knowledge bases, training data collection, and content aggregation for LLM applications. It includes built-in support for the Model Context Protocol (MCP) for enhanced context management.

```json
{
    "mcpServers": {
        "langgraph-crawler": {
            "command": "npx",
            "args": ["-y", "@langgraph-js/crawler-mcp@latest"]
        }
    }
}
```

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
- [x] CSDN
- [ ] Zhihu (知乎)

## License

Apache-2.0
