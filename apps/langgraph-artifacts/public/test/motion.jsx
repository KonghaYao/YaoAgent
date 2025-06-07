import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

// App 组件
function App() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-12 text-center">Framer Motion & Tailwind CSS 示例</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
                {/* 1. 基本的淡入平移 */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="bg-blue-600 p-8 rounded-lg shadow-xl text-white flex flex-col items-center justify-center min-h-[200px]"
                >
                    <p className="text-2xl font-bold mb-2">淡入平移</p>
                    <p className="text-center">从底部淡入并向上平移</p>
                </motion.div>

                {/* 2. 弹簧缩放动画 */}
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.2,
                    }}
                    className="bg-purple-600 p-8 rounded-lg shadow-xl text-white flex flex-col items-center justify-center min-h-[200px]"
                >
                    <p className="text-2xl font-bold mb-2">弹簧缩放</p>
                    <p className="text-center">带有弹跳效果的缩放</p>
                </motion.div>

                {/* 3. 鼠标悬停/点击交互 */}
                <motion.div
                    whileHover={{ scale: 1.05, rotate: 3, backgroundColor: "#dc2626" }} // Tailwind color: red-600
                    whileTap={{ scale: 0.95 }}
                    className="bg-red-500 p-8 rounded-lg shadow-xl text-white flex flex-col items-center justify-center cursor-pointer min-h-[200px]"
                    // 注意：whileHover 和 whileTap 中直接使用颜色十六进制值是因为 Tailwind 的 JIT 模式默认不处理动态类名。
                    // 如果想用 Tailwind 类名，可以配置 safeList 或使用 tailwind-merge 等工具，
                    // 但对于动画值，直接使用颜色值更常见。
                >
                    <p className="text-2xl font-bold mb-2">悬停与点击</p>
                    <p className="text-center">鼠标悬停和点击时的交互</p>
                </motion.div>

                {/* 4. 关键帧循环动画 */}
                <motion.div
                    animate={{
                        x: [0, 50, -50, 0], // 左右移动
                        rotate: [0, 10, -10, 0], // 旋转
                        scale: [1, 1.1, 0.9, 1], // 缩放
                        backgroundColor: ["#10b981", "#ef4444", "#3b82f6", "#10b981"], // 颜色变化: emerald -> red -> blue -> emerald
                    }}
                    transition={{
                        duration: 4,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatType: "mirror",
                    }}
                    className="bg-emerald-500 p-8 rounded-lg shadow-xl text-white flex flex-col items-center justify-center min-h-[200px]"
                >
                    <p className="text-2xl font-bold mb-2">关键帧循环</p>
                    <p className="text-center">多属性无限循环动画</p>
                </motion.div>

                {/* 5. 元素进入视口时动画 (Scroll Reveal) */}
                <ScrollRevealBox />

                {/* 6. 另一个滚动触发动画 */}
                <ScrollRevealBox delay={0.4} />
            </div>
        </div>
    );
}

// 独立的 ScrollRevealBox 组件
function ScrollRevealBox({ delay = 0 }) {
    const ref = useRef(null);
    // useInView 钩子用于检测元素是否在视口中
    const isInView = useInView(ref, { once: true, amount: 0.5 }); // amount: 0.5 表示元素一半进入视口时触发

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -100 }}
            // 当 isInView 为 true 时应用动画
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: delay }}
            className="bg-teal-600 p-8 rounded-lg shadow-xl text-white flex flex-col items-center justify-center min-h-[200px]"
        >
            <p className="text-2xl font-bold mb-2">滚动显示动画</p>
            <p className="text-center">{isInView ? "我已进入视口！" : "向下滚动查看此动画"}</p>
        </motion.div>
    );
}

export default App;
