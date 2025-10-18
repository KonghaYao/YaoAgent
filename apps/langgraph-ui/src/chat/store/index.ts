export const setLocalConfig = (config: Partial<{ showHistory: boolean; showGraph: boolean }>) => {
    Object.entries(config).forEach(([key, value]) => {
        localStorage.setItem(key, value.toString());
    });
};
