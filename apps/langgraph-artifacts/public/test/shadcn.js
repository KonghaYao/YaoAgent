// components/timer.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button"; // 假设你的 Button 组件路径是这样
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // 假设你的 Card 组件路径是这样

export function Timer() {
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef(null); // 用于存储 setInterval 的引用

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setSeconds((prevSeconds) => prevSeconds + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }

        // 清理函数：组件卸载或 isRunning 改变时清除 interval
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const handleStart = () => {
        setIsRunning(true);
    };

    const handlePause = () => {
        setIsRunning(false);
    };

    const handleReset = () => {
        setIsRunning(false);
        setSeconds(0);
    };

    // 格式化时间，显示为 HH:MM:SS
    const formatTime = (totalSeconds) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        return [hours, minutes, secs].map((unit) => String(unit).padStart(2, "0")).join(":");
    };

    return (
        <Card className="w-[350px]">
            <CardHeader>
                <CardTitle>计时器</CardTitle>
                <CardDescription>一个简单的计时器。</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-6">
                <div className="text-6xl font-bold font-mono">{formatTime(seconds)}</div>
                <div className="flex space-x-4">
                    <Button onClick={handleStart} disabled={isRunning}>
                        开始
                    </Button>
                    <Button onClick={handlePause} disabled={!isRunning}>
                        暂停
                    </Button>
                    <Button onClick={handleReset}>重置</Button>
                </div>
            </CardContent>
        </Card>
    );
}
