export class SpendTime {
    private timeCounter = new Map<string, [Date, Date] | [Date]>();

    start(key: string) {
        this.timeCounter.set(key, [new Date()]);
    }

    end(key: string) {
        this.timeCounter.set(key, [this.timeCounter.get(key)?.[0] || new Date(), new Date()]);
    }
    setSpendTime(key: string) {
        if (this.timeCounter.has(key)) {
            this.end(key);
        } else {
            this.start(key);
        }
    }
    getStartTime(key: string) {
        return this.timeCounter.get(key)?.[0] || new Date();
    }
    getEndTime(key: string) {
        return this.timeCounter.get(key)?.[1] || new Date();
    }

    getSpendTime(key: string) {
        const [start, end = new Date()] = this.timeCounter.get(key) || [new Date(), new Date()];
        return end.getTime() - start.getTime();
    }
}
