// https://www.google.com/s2/favicons?domain=${domain}&sz=${size}

export const getFavicon = async (domain: string, size: number = 16) => {
    const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
    const res = await fetch(url);
    return res.arrayBuffer();
};

export const handleFavicon = async (req: Request) => {
    // localhost:8000/favicon/google.com?size=32
    const url = new URL(req.url);
    const domain = url.pathname.slice(9);
    const size = url.searchParams.get("size") || 32;
    const favicon = await getFavicon(domain, Number(size));
    return new Response(favicon, {
        headers: { "Content-Type": "image/x-icon" },
    });
};
