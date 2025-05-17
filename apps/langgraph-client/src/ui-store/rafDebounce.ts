/**
 * Creates a debounced function that executes once per animation frame
 * @param callback - The function to debounce
 * @returns A function that executes the callback on the next animation frame
 */
export function rafDebounce<T extends (...args: any[]) => any>(callback: T): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    let lastArgs: Parameters<T> | null = null;

    // Return the debounced function
    return function (...args: Parameters<T>): void {
        // Store the most recent arguments
        lastArgs = args;

        // Cancel any pending animation frame
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }

        // Schedule execution on the next animation frame
        rafId = requestAnimationFrame(() => {
            if (lastArgs !== null) {
                callback(...lastArgs);
                lastArgs = null;
            }
            rafId = null;
        });
    };
}
