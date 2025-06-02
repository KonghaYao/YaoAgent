import iconv from "iconv-lite";

export function decodeCharset(text: ArrayBuffer, charset: string = "utf-8") {
    try {
        return iconv.decode(new Uint8Array(text) as unknown as Buffer, charset);
    } catch (error) {
        console.error(`Failed to decode text with charset ${charset}:`, error);
        return text;
    }
}
