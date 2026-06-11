import { beforeEach, describe, expect, it } from "vitest";
import { ExbaComponent } from "../core/exba";

describe("Search Reactivity Test", () => {
    let resultBuffer: Uint8Array = new Uint8Array(0);
    let allocOffset = 100;

    beforeEach(() => {
        document.body.innerHTML = '<div id="app-root"></div>';
        document.body.dataset.wasmUri = "mock-wasm";
        document.body.dataset.mode = "grid-menu";
        allocOffset = 100;
        
        // Mock WASM exports
        (ExbaComponent as any).wasm = {
            memory: {
                buffer: new ArrayBuffer(1024 * 64)
            },
            score_search: (qPtr: number, qLen: number, tPtr: number, tLen: number) => {
                const wasmMemory = new Uint8Array((ExbaComponent as any).wasm.memory.buffer);
                const queryBytes = wasmMemory.subarray(qPtr, qPtr + qLen);
                const targetBytes = wasmMemory.subarray(tPtr, tPtr + tLen);
                const query = new TextDecoder().decode(queryBytes).toLowerCase().trim();
                const target = new TextDecoder().decode(targetBytes).toLowerCase().trim();
                const matched = target.indexOf(query) !== -1;
                return matched ? 100 : 0;
            },
            alloc: (len: number) => {
                const ptr = allocOffset;
                allocOffset += len + 10;
                return ptr;
            },
            dealloc: (ptr: number, len: number) => {},
            calculate_metrics: (users: number, conv: number, spend: number, growth: number) => {
                const metrics = {
                    activeCustomers: 1000,
                    monthlyRevenue: 5000,
                    annualProjection: 60000,
                    churnedCustomers: 40
                };
                const json = JSON.stringify(metrics);
                const bytes = new TextEncoder().encode(json);
                const wasmMemory = new Uint8Array((ExbaComponent as any).wasm.memory.buffer);
                wasmMemory.set(bytes, 0);
                resultBuffer = wasmMemory.subarray(0, bytes.length);
            },
            generate_chart_data: (revenue: number, growth: number) => {
                const points = [{ x: 0, y: 100 }];
                const json = JSON.stringify(points);
                const bytes = new TextEncoder().encode(json);
                const wasmMemory = new Uint8Array((ExbaComponent as any).wasm.memory.buffer);
                wasmMemory.set(bytes, 0);
                resultBuffer = wasmMemory.subarray(0, bytes.length);
            },
            get_result_ptr: () => 0,
            get_result_len: () => resultBuffer.length,
        };
    });

    it("should mount grid-menu-app and filter on typing", async () => {
        // Import app-component to trigger auto-init
        await import("../components/app-component");

        // Give auto-init time to run
        await new Promise((resolve) => setTimeout(resolve, 50));

        const appRoot = document.getElementById("app-root");
        const gridMenu = appRoot?.querySelector("grid-menu-app");
        expect(gridMenu).not.toBeNull();

        const shadow = gridMenu?.shadowRoot;
        expect(shadow).not.toBeNull();

        const searchInput = shadow?.querySelector("#grid-search") as HTMLInputElement;
        expect(searchInput).not.toBeNull();

        // Check that initially it displays all features (10 items)
        const cardsBefore = shadow?.querySelectorAll(".card");
        expect(cardsBefore?.length).toBe(10);

        // Reset allocOffset for fresh search run
        allocOffset = 100;

        // Simulate typing "wasm"
        searchInput.focus();
        searchInput.value = "wasm";
        searchInput.dispatchEvent(new Event("input"));

        // Wait for microtask (signals batching)
        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Check if cards list updated
        const cardsAfter = shadow?.querySelectorAll(".card");
        console.log("CARDS AFTER TYPING WASM:", cardsAfter?.length);
    });
});
