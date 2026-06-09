/**
 * Debounce a function to limit execution frequency.
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
    let timeout: number | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Format numbers as currency strings.
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Format numbers for UI display.
 */
export function formatNumber(value: number, digits = 0): string {
    return new Intl.NumberFormat("en-US", {
        maximumFractionDigits: digits,
    }).format(value);
}

/**
 * Robustly call a WASM function and fetch the string result.
 */
export function callWasm(wasm: any, fnName: string, ...args: any[]): any {
    if (!wasm) throw new Error("WASM engine not initialized");
    if (typeof wasm[fnName] !== "function") throw new Error(`WASM function ${fnName} not found`);

    wasm[fnName](...args);

    const ptr = wasm.get_result_ptr();
    const len = wasm.get_result_len();
    const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
    const jsonString = new TextDecoder("utf-8").decode(memory);

    return JSON.parse(jsonString);
}

/**
 * Copies a JavaScript string into the WASM memory and returns its pointer and length.
 * Useful for passing text data to Rust.
 */
export function passStringToWasm(wasm: any, str: string): [number, number] {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const len = bytes.length;
    const ptr = wasm.alloc(len);

    const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
    memory.set(bytes);

    return [ptr, len];
}

