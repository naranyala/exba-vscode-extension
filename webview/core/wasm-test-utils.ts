import type { WasmBridge } from "./wasm-bridge";
import type { WasmExports } from "./wasm-types";

interface MockWasmOverrides {
    exports?: Partial<WasmExports>;
    calculateMetrics?: (
        users: number,
        conversionRate: number,
        avgSpend: number,
        growthRate: number,
    ) => any;
    generateChartData?: (initialRevenue: number, growthRate: number) => any;
    scoreSearch?: (query: string, targetText: string) => number;
    formatText?: (input: string) => any;
    isReady?: boolean;
}

let allocOffset = 100;

export function createMockWasmExports(
    overrides?: Partial<WasmExports>,
): WasmExports & { memory: WebAssembly.Memory } {
    return {
        memory: { buffer: new ArrayBuffer(1024 * 64) } as WebAssembly.Memory,
        get_result_ptr: () => 0,
        get_result_len: () => 0,
        alloc: (len: number) => {
            const ptr = allocOffset;
            allocOffset += len + 10;
            return ptr;
        },
        dealloc: () => {},
        calculate_metrics: () => {},
        generate_chart_data: () => {},
        score_search: () => 100,
        format_text: () => 0,
        ...overrides,
    };
}

export function createMockWasmBridge(overrides?: MockWasmOverrides): WasmBridge {
    const mockExports = createMockWasmExports(overrides?.exports);

    const mock = {
        _exports: mockExports,
        _status: overrides?.isReady === false ? ("uninitialized" as const) : ("ready" as const),
        _debug: false,
        _error: null,
        isReady: overrides?.isReady ?? true,
        exports: mockExports,
        init: async () => {},
        reset: () => {},
        calculateMetrics:
            overrides?.calculateMetrics ??
            (() => ({
                activeCustomers: 1000,
                monthlyRevenue: 5000,
                annualProjection: 60000,
                churnedCustomers: 40,
            })),
        generateChartData: overrides?.generateChartData ?? (() => [{ x: 0, y: 100 }]),
        scoreSearch:
            overrides?.scoreSearch ??
            ((query: string, targetText: string) => {
                const matched = targetText.toLowerCase().indexOf(query.toLowerCase()) !== -1;
                return matched ? 100 : 0;
            }),
        formatText:
            overrides?.formatText ??
            ((input: string) => ({
                original: input,
                uppercase: input.toUpperCase(),
                lowercase: input.toLowerCase(),
                length: input.length,
                word_count: input ? input.split(/\s+/).length : 0,
            })),
        _callJson: () => null,
        _callInt: () => 0,
        _callF64: () => 0,
        _readJsonResult: () => null,
        _isErrorResponse: () => false,
        _passString: () => [0, 0],
        _freeString: () => {},
        _ensureReady: () => {},
    } as unknown as WasmBridge;

    return mock;
}
