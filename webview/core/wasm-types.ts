export interface WasmExports {
    memory: WebAssembly.Memory;
    get_result_ptr: () => number;
    get_result_len: () => number;
    alloc: (size: number) => number;
    dealloc: (ptr: number, size: number) => void;

    calculate_metrics: (
        users: number,
        conversionRate: number,
        avgSpend: number,
        growthRate: number,
    ) => void;
    generate_chart_data: (initialRevenue: number, growthRate: number) => void;
    score_search: (
        queryPtr: number,
        queryLen: number,
        targetPtr: number,
        targetLen: number,
    ) => number;
    format_text: (inputPtr: number, inputLen: number) => number;
}

export interface MetricsResult {
    activeCustomers: number;
    monthlyRevenue: number;
    annualProjection: number;
    churnedCustomers: number;
}

export interface ChartPoint {
    x: number;
    y: number;
}

export interface FormattedText {
    original: string;
    uppercase: string;
    lowercase: string;
    length: number;
    word_count: number;
}

export interface SearchScored {
    score: number;
}

export interface WasmErrorResponse {
    error: string;
}

export interface WasmConfig {
    wasmUri: string;
    debug?: boolean;
}

export type WasmStatus = "uninitialized" | "loading" | "ready" | "error";
