import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
const App = () => {
    // 使用 useState 钩子来管理计数器的状态
    const [count, setCount] = useState(0);

    // 增加计数的函数
    const increment = () => {
        setCount(count + 1);
    };

    // 减少计数的函数
    const decrement = () => {
        setCount(count - 1);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full text-center">
                <Plus />
                <h1 className="text-3xl font-bold text-gray-800 mb-6">计数器</h1>

                {/* 显示当前计数 */}
                <p className="text-6xl font-extrabold text-blue-600 mb-8 select-none">{count}</p>

                {/* 按钮容器 */}
                <div className="flex justify-center space-x-4">
                    {/* 减少按钮 */}
                    <button
                        onClick={decrement}
                        className="px-6 py-3 bg-red-500 text-white rounded-md font-semibold text-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:scale-105"
                    >
                        减少
                    </button>

                    {/* 增加按钮 */}
                    <button
                        onClick={increment}
                        className="px-6 py-3 bg-green-500 text-white rounded-md font-semibold text-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 transition duration-200 ease-in-out transform hover:scale-105"
                    >
                        增加
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;
