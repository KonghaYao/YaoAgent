/**
 * @zh SpendTime 类用于计算和记录操作的耗时。
 * @en The SpendTime class is used to calculate and record the time spent on operations.
 */
export class SpendTime {
    private timeCounter = new Map<string, [Date, Date] | [Date]>();

    /**
     * @zh 开始计时。
     * @en Starts timing.
     */
    start(key: string) {
        this.timeCounter.set(key, [new Date()]);
    }

    /**
     * @zh 结束计时。
     * @en Ends timing.
     */
    end(key: string) {
        this.timeCounter.set(key, [this.timeCounter.get(key)?.[0] || new Date(), new Date()]);
    }

    /**
     * @zh 设置或更新指定键的耗时记录。如果键已存在，则更新结束时间；否则，开始新的计时。
     * @en Sets or updates the time spent record for the specified key. If the key already exists, updates the end time; otherwise, starts a new timing.
     */
    setSpendTime(key: string) {
        if (this.timeCounter.has(key)) {
            this.end(key);
        } else {
            this.start(key);
        }
    }

    /**
     * @zh 获取指定键的开始时间。
     * @en Gets the start time for the specified key.
     */
    getStartTime(key: string) {
        return this.timeCounter.get(key)?.[0] || new Date();
    }

    /**
     * @zh 获取指定键的结束时间。
     * @en Gets the end time for the specified key.
     */
    getEndTime(key: string) {
        return this.timeCounter.get(key)?.[1] || new Date();
    }

    /**
     * @zh 获取指定键的耗时（毫秒）。
     * @en Gets the time spent (in milliseconds) for the specified key.
     */
    getSpendTime(key: string) {
        const [start, end = new Date()] = this.timeCounter.get(key) || [new Date(), new Date()];
        return end.getTime() - start.getTime();
    }
}
