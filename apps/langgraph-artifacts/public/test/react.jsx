import React from "react";

const AINewsSummary = () => {
    const newsData = [
        {
            title: "AI资讯_获取AGI最新头条资讯",
            url: "https://www.aibase.com/zh/www.aibase.com/zh/news",
            description: "最新新闻 ; 博世携手阿里云推出智能座舱新体验：3D 数字人助力AI 交互 ; Perplexity AI 推出SEC 数据集成，助力投资者轻松获取财务信息 ; ​Figma 推出新工具，助力AI 更精准地 ...",
        },
        {
            title: "每日AI资讯、热点、动态、融资、产品发布",
            url: "https://ai-bot.cn/daily-ai-news",
            description: "每日AI快讯热闻 · 昆仑万维天工超级智能体APP今日正式上线！ · 红杉中国推出全新AI基准测试工具xbench，动态更新测试内容 · 首款家庭桌面AI机器人全国首发！ · OpenAI 升级 ...",
        },
        {
            title: "AI人工智能-每日最新AI新闻&文章",
            url: "https://www.ainav.cn/news",
            description: "před 2 dny — 每日最新AI 新闻& 文章，9 点更新 · 1 · 位图灵奖得主布道，2大冠军机器人登台，“AI春晚”果然又高又硬 · 清华团队颠覆常识：大模型强化学习仅用20% ...",
        },
        {
            title: "人工智能消息与行业资讯动态",
            url: "https://www.ofweek.com/ai/CATList-201700-8100-ai.html",
            description: "行业站点： ; 国家数据局局长刘烈宏调研格创东智. 前天17:42 ; 【联想】参与“维科杯·OFweek 2025（第十届）人工智能行业年度评选”. 前天17:30 ; 【闪迪】参与“维科杯·OFweek 2025 ...",
        },
        {
            title: "人工智能| 联合国新闻",
            url: "https://news.un.org/zh/tags/rengongzhineng",
            description: "联合国报告：人工智能将发展为4.8万亿美元市场​ 联合国的一份报告预测，到2033年，人工智能将发展成为价值4.8万亿美元的全球市场，规模相当于德国当前的经济总量。 然而，如果不 ...",
        },
        {
            title: "AI资讯-追踪AI行业的最新资讯 - AIHub",
            url: "https://www.aihub.cn/news",
            description: "AIHub每日实时更新AI行业的最新资讯、新闻、产品动态，让你随时了解人工智能领域的最新趋势和热门事件。",
        },
        {
            title: "AI最新资讯 - 快科技- 驱动之家",
            url: "https://news.mydrivers.com/tag/ai.htm",
            description: "王自如AI创业坦言“来钱快” · 2025-06-06 ; 王自如回忆15年过往：更愿意去怀念刚刚创业的日子 · 2025-06-06 ; 评测鼻祖王自如宣布重新创业直言选AI是来钱快 · 2025-06-06 ; OpenAI ...",
        },
        {
            title: "今日#AI 最新资讯、观点和推送| 币安广场",
            url: "https://www.binance.com/zh-CN/square/hashtag/AI",
            description: "关键见解： 人工智能代币：在名单上名列前茅，近24%的用户预计将出现显著增长。 迷因币：保持强烈吸引力，19.09%的用户对其潜力持乐观态度。 去中心化金融与第一层代币：同样 ...",
        },
        {
            title: "AI 导航官网| AI 资讯",
            url: "https://www.aiopenminds.com/ai/news",
            description: "上海AI实验室造出首个「通才」机器人大脑：看懂世界+空间推理+精准操控全拿下 · 大模型结构化推理优势难复制到垂直领域！ · 大神Karpathy炮轰复杂UI应用没有未来，Adobe首当其冲 ...",
        },
        {
            title: "歸藏的AI资讯",
            url: "https://www.guizang.ai",
            description: "Morph Studio AI 视频生成和编排工具现在正式向所有用户推出。 支持视频生成角色一致性和配音生成也即将加入。 ... Meta 在雷朋Meta 眼镜上推出了多模态的Meta AI。 Meta AI ...",
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-8 font-sans">
            <header className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 drop-shadow-lg animate-pulse">今日AI最新资讯汇总 🚀</h1>
                <p className="text-2xl mt-4 text-gray-400">每日精选，洞察人工智能前沿动态</p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {newsData.map((news, index) => (
                    <div key={index} className="bg-gray-800 rounded-xl shadow-2xl p-6 border border-gray-700 hover:border-purple-500 transition-all duration-300 transform hover:scale-105 group">
                        <h2 className="text-3xl font-bold text-purple-300 mb-3 group-hover:text-pink-400 transition-colors duration-300">{news.title}</h2>
                        <p className="text-gray-400 mb-5 leading-relaxed">{news.description}</p>
                        <a
                            href={news.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                            阅读原文 🔗
                        </a>
                    </div>
                ))}
            </main>

            <footer className="mt-16 text-center text-gray-500 text-sm">
                <p>&copy; 2025 Aura AI. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default AINewsSummary;
