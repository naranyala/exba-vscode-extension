import type {
    ChartPoint,
    FormattedText,
    MetricsResult,
    WasmConfig,
    WasmErrorResponse,
    WasmExports,
    WasmStatus,
} from "./wasm-types";

const FETCH_TIMEOUT_MS = 30_000;

type WasmFnReturnStyle = "json" | "int" | "f64";

interface WasmFnDef {
    name: string;
    returnStyle: WasmFnReturnStyle;
}

const WASM_FUNCTIONS: WasmFnDef[] = [
    { name: "calculate_metrics", returnStyle: "json" },
    { name: "generate_chart_data", returnStyle: "json" },
    { name: "score_search", returnStyle: "int" },
    { name: "format_text", returnStyle: "json" },
];

export class WasmBridge {
    private static _instance: WasmBridge | null = null;
    private _exports: WasmExports | null = null;
    private _status: WasmStatus = "uninitialized";
    private _error: string | null = null;
    private _debug = false;

    static get instance(): WasmBridge {
        if (!WasmBridge._instance) {
            WasmBridge._instance = new WasmBridge();
        }
        return WasmBridge._instance;
    }

    /** @internal Used by tests to inject a mock instance. */
    static _setTestingInstance(mock: WasmBridge | null): void {
        WasmBridge._instance = mock;
    }

    get status(): WasmStatus {
        return this._status;
    }

    get error(): string | null {
        return this._error;
    }

    get isReady(): boolean {
        return this._status === "ready";
    }

    get exports(): WasmExports {
        if (!this._exports) {
            throw new Error("WASM not initialized. Call init() first.");
        }
        return this._exports;
    }

    reset(): void {
        this._exports = null;
        this._status = "uninitialized";
        this._error = null;
        this._debug = false;
    }

    async init(config: WasmConfig, force = false): Promise<void> {
        if (this._status === "ready" && !force) return;
        if (this._status === "loading") return;

        this._status = "loading";
        this._error = null;
        this._debug = config.debug ?? false;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

            let response: Response;
            try {
                response = await fetch(config.wasmUri, {
                    signal: controller.signal,
                });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
            }

            const buffer = await response.arrayBuffer();

            const importObject = {
                env: {
                    js_log: (ptr: number, len: number) => {
                        const wasm = this._exports;
                        if (!wasm) {
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = 0;
                            }
                            return;
                        }
                        const memory = new Uint8Array((wasm as any).memory.buffer, ptr, len);
                        const message = new TextDecoder("utf-8").decode(memory);
                        if (
                            this._debug ||
                            message.startsWith("[ERROR]") ||
                            message.startsWith("[PANIC]")
                        ) {
                            if (message.startsWith("[PANIC]") || message.startsWith("[ERROR]")) {
                                console.error(`[RUST] ${message}`);
                            } else {
                                console.log(`[RUST] ${message}`);
                            }
                        }
                    },
                },
            };

            const { instance } = await WebAssembly.instantiate(buffer, importObject);
            this._exports = instance.exports as unknown as WasmExports;
            this._validateExports();
            this._status = "ready";

            if (this._debug) {
                console.log("[WASM] Engine initialized successfully");
            }
        } catch (err) {
            this._status = "error";
            this._error = err instanceof Error ? err.message : String(err);
            console.error("[WASM] Failed to initialize:", this._error);
            throw err;
        }
    }

    private _validateExports(): void {
        const exports = this._exports;
        if (!exports) return;
        for (const fn of WASM_FUNCTIONS) {
            const exportFn = (exports as any)[fn.name];
            if (typeof exportFn !== "function") {
                console.warn(
                    `[WASM] Expected export "${fn.name}" not found or not a function. Rust macro output may be out of sync with WasmExports type.`,
                );
            }
        }
    }

    private _ensureReady(): void {
        if (!this._exports) throw new Error("WASM not initialized");
    }

    private _callJson<T>(fnName: string, args: any[]): T {
        this._ensureReady();
        (this._exports as any)[fnName](...args);
        return this._readJsonResult<T>();
    }

    private _callInt(fnName: string, args: any[]): number {
        this._ensureReady();
        return (this._exports as any)[fnName](...args);
    }

    private _callF64(fnName: string, args: any[]): number {
        this._ensureReady();
        return (this._exports as any)[fnName](...args);
    }

    private _readJsonResult<T>(): T {
        const exports = this._exports;
        if (!exports) {
            throw new Error("WASM not initialized");
        }
        const ptr = exports.get_result_ptr();
        const len = exports.get_result_len();

        if (len === 0) {
            throw new Error("WASM returned empty result buffer");
        }

        let jsonString: string;
        try {
            const memory = new Uint8Array(exports.memory.buffer, ptr, len);
            jsonString = new TextDecoder("utf-8").decode(memory);
        } catch (e) {
            throw new Error(
                `Failed to read WASM result buffer: ${e instanceof Error ? e.message : String(e)}`,
            );
        }

        let parsed: T;
        try {
            parsed = JSON.parse(jsonString) as T;
        } catch (e) {
            throw new Error(
                `WASM returned malformed JSON: ${e instanceof Error ? e.message : String(e)}`,
            );
        }

        if (this._isErrorResponse(parsed as Record<string, unknown>)) {
            const errResp = parsed as unknown as WasmErrorResponse;
            throw new Error(errResp.error);
        }

        return parsed;
    }

    private _isErrorResponse(obj: Record<string, unknown>): obj is WasmErrorResponse {
        return typeof obj.error === "string";
    }

    private _passString(str: string): [number, number] {
        this._ensureReady();
        const exports = this._exports;
        if (!exports) {
            throw new Error("WASM not initialized");
        }

        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const len = bytes.length;

        if (len === 0) return [0, 0];

        const ptr = exports.alloc(len);
        if (ptr === 0) {
            throw new Error("WASM alloc returned null pointer (out of memory?)");
        }

        const memory = new Uint8Array(exports.memory.buffer, ptr, len);
        memory.set(bytes);

        return [ptr, len];
    }

    private _freeString(ptr: number, len: number): void {
        if (ptr === 0) return;
        const exports = this._exports;
        if (!exports) return;

        if (len > 0) {
            try {
                const memory = new Uint8Array(exports.memory.buffer, ptr, len);
                memory.fill(0);
            } catch {
                // Memory may have grown — ignore zeroing errors
            }
        }

        exports.dealloc(ptr, len);
    }

    calculateMetrics(
        users: number,
        conversionRate: number,
        avgSpend: number,
        growthRate: number,
    ): MetricsResult {
        return this._callJson<MetricsResult>("calculate_metrics", [
            users,
            conversionRate,
            avgSpend,
            growthRate,
        ]);
    }

    generateChartData(initialRevenue: number, growthRate: number): ChartPoint[] {
        return this._callJson<ChartPoint[]>("generate_chart_data", [initialRevenue, growthRate]);
    }

    scoreSearch(query: string, targetText: string): number {
        let qPtr = 0;
        let qLen = 0;
        let tPtr = 0;
        let tLen = 0;
        try {
            if (query) [qPtr, qLen] = this._passString(query);
            if (targetText) [tPtr, tLen] = this._passString(targetText);
            return this._callInt("score_search", [qPtr, qLen, tPtr, tLen]);
        } finally {
            this._freeString(qPtr, qLen);
            this._freeString(tPtr, tLen);
        }
    }

    formatText(input: string): FormattedText {
        let ptr = 0;
        let len = 0;
        try {
            if (input) [ptr, len] = this._passString(input);
            return this._callJson<FormattedText>("format_text", [ptr, len]);
        } finally {
            this._freeString(ptr, len);
        }
    }
}
