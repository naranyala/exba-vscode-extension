import { beforeEach, describe, expect, it, vi } from "vitest";
import { WasmBridge } from "../core/wasm-bridge";
import { createMockWasmExports } from "../core/wasm-test-utils";

describe("WasmBridge Core Logic", () => {
    beforeEach(() => {
        WasmBridge.instance.reset();
    });

    describe("Initialization & Validation", () => {
        it("should set status to loading during init", async () => {
            const mockExports = createMockWasmExports();
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(0),
            });
            global.WebAssembly.instantiate = vi.fn().mockResolvedValue({
                instance: { exports: mockExports },
            });
            const initPromise = WasmBridge.instance.init({ wasmUri: "mock.wasm" });
            expect(WasmBridge.instance.status).toBe("loading");
            await initPromise;
        });

        it("should throw error when calling methods before init", () => {
            expect(() => WasmBridge.instance.calculateMetrics(1, 1, 1, 1)).toThrow(
                "WASM not initialized",
            );
        });

        it("should warn when exports are missing", async () => {
            const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            const mockExports = createMockWasmExports({
                calculate_metrics: undefined as any, // missing
            });

            // We need to bypass the actual fetch in init() for this test
            // Since init() uses fetch, we can mock global fetch
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(0),
            });

            // We mock WebAssembly.instantiate to return our mock exports
            global.WebAssembly.instantiate = vi.fn().mockResolvedValue({
                instance: { exports: mockExports },
            });

            await WasmBridge.instance.init({ wasmUri: "mock.wasm" });
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Expected export "calculate_metrics" not found'),
            );
            consoleSpy.mockRestore();
        });
    });

    describe("Dispatch Helpers", () => {
        beforeEach(async () => {
            // Setup a ready bridge for method tests
            const mockExports = createMockWasmExports();
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(0),
            });
            global.WebAssembly.instantiate = vi.fn().mockResolvedValue({
                instance: { exports: mockExports },
            });
            await WasmBridge.instance.init({ wasmUri: "mock.wasm" });
        });

        it("should correctly dispatch and parse JSON results via _callJson", () => {
            const mockData = { foo: "bar" };
            const exports = WasmBridge.instance.exports;
            (exports as any).test_fn = vi.fn();

            // Mock the result buffer reading
            // We need to mock get_result_ptr and get_result_len
            (exports as any).get_result_ptr = () => 0;
            (exports as any).get_result_len = () => JSON.stringify(mockData).length;

            // Mock the memory buffer
            const encoder = new TextEncoder();
            const bytes = encoder.encode(JSON.stringify(mockData));
            (exports as any).memory = {
                buffer: bytes.buffer,
            };

            // Using a private method for test - cast to any
            const result = (WasmBridge.instance as any)._callJson("test_fn", []);
            expect(result).toEqual(mockData);
        });

        it("should throw error when WASM returns an error response", () => {
            const errorResp = { error: "WASM PANIC" };
            const exports = WasmBridge.instance.exports;
            (exports as any).test_fn = vi.fn();

            (exports as any).get_result_ptr = () => 0;
            (exports as any).get_result_len = () => JSON.stringify(errorResp).length;

            const encoder = new TextEncoder();
            const bytes = encoder.encode(JSON.stringify(errorResp));
            (exports as any).memory = { buffer: bytes.buffer };

            expect(() => (WasmBridge.instance as any)._callJson("test_fn", [])).toThrow(
                "WASM PANIC",
            );
        });

        it("should correctly dispatch scalar integers via _callInt", () => {
            const exports = WasmBridge.instance.exports;
            (exports as any).test_int = () => 42;

            const result = (WasmBridge.instance as any)._callInt("test_int", []);
            expect(result).toBe(42);
        });

        it("should correctly dispatch scalar floats via _callF64", () => {
            const exports = WasmBridge.instance.exports;
            (exports as any).test_f64 = () => 3.14;

            const result = (WasmBridge.instance as any)._callF64("test_f64", []);
            expect(result).toBe(3.14);
        });
    });

    describe("Memory Management", () => {
        beforeEach(async () => {
            const mockExports = createMockWasmExports();
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(0),
            });
            global.WebAssembly.instantiate = vi.fn().mockResolvedValue({
                instance: { exports: mockExports },
            });
            await WasmBridge.instance.init({ wasmUri: "mock.wasm" });
        });

        it("should correctly pass strings to WASM linear memory", () => {
            const exports = WasmBridge.instance.exports;
            const str = "Hello WASM";
            const encoder = new TextEncoder();
            const expectedBytes = encoder.encode(str);

            const [ptr, len] = (WasmBridge.instance as any)._passString(str);
            expect(len).toBe(expectedBytes.length);

            const memory = new Uint8Array(exports.memory.buffer, ptr, len);
            expect(memory).toEqual(expectedBytes);
        });

        it("should zero and deallocate strings via _freeString", () => {
            const exports = WasmBridge.instance.exports;
            const str = "Secret";
            const [ptr, len] = (WasmBridge.instance as any)._passString(str);

            const deallocSpy = vi.spyOn(exports, "dealloc");
            (WasmBridge.instance as any)._freeString(ptr, len);

            expect(deallocSpy).toHaveBeenCalledWith(ptr, len);

            const memory = new Uint8Array(exports.memory.buffer, ptr, len);
            expect(memory.every((b) => b === 0)).toBe(true);
        });
    });
});
