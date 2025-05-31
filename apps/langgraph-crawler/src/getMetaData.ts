export interface MetaData {
    title?: string;
    description?: string;
    keywords?: string;
    author?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    canonical?: string;
}

export function getMetaData(doc: Document): MetaData {
    const metaData: MetaData = {};

    // 获取基本 meta 标签
    metaData.title = doc.querySelector("title")?.textContent || undefined;
    metaData.description = doc.querySelector('meta[name="description"]')?.getAttribute("content") || undefined;
    metaData.keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute("content") || undefined;
    metaData.author = doc.querySelector('meta[name="author"]')?.getAttribute("content") || undefined;

    // 获取 Open Graph meta 标签
    metaData.ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || undefined;
    metaData.ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute("content") || undefined;
    metaData.ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute("content") || undefined;

    // 获取 Twitter Card meta 标签
    metaData.twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || undefined;
    metaData.twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content") || undefined;
    metaData.twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content") || undefined;

    // 获取规范链接
    metaData.canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute("href") || undefined;

    return metaData;
}

/**
 * 将 MetaData 对象转换为 YAML 格式的字符串
 * @param metaData MetaData 对象
 * @returns YAML 格式的字符串
 */
export function metaDataToYaml(metaData: MetaData): string {
    const lines: string[] = [];

    // 基本 meta 信息
    if (metaData.title) lines.push(`title: ${metaData.title}`);
    if (metaData.description) lines.push(`description: ${metaData.description}`);
    if (metaData.keywords) lines.push(`keywords: ${metaData.keywords}`);
    if (metaData.author) lines.push(`author: ${metaData.author}`);

    // Open Graph 信息
    if (metaData.ogTitle || metaData.ogDescription || metaData.ogImage) {
        lines.push("og:");
        if (metaData.ogTitle) lines.push(`  title: ${metaData.ogTitle}`);
        if (metaData.ogDescription) lines.push(`  description: ${metaData.ogDescription}`);
        if (metaData.ogImage) lines.push(`  image: ${metaData.ogImage}`);
    }

    // Twitter Card 信息
    if (metaData.twitterTitle || metaData.twitterDescription || metaData.twitterImage) {
        lines.push("twitter:");
        if (metaData.twitterTitle) lines.push(`  title: ${metaData.twitterTitle}`);
        if (metaData.twitterDescription) lines.push(`  description: ${metaData.twitterDescription}`);
        if (metaData.twitterImage) lines.push(`  image: ${metaData.twitterImage}`);
    }

    // 规范链接
    if (metaData.canonical) lines.push(`canonical: ${metaData.canonical}`);

    return lines.join("\n");
}
