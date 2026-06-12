import { beforeEach, describe, expect, it } from "vitest";
import { WasmBridge } from "../core/wasm-bridge";
import { createMockWasmBridge } from "../core/wasm-test-utils";

describe("Search Reactivity Test", () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="app-root"></div>';
        document.body.dataset.wasmUri = "mock-wasm";
        document.body.dataset.mode = "grid-menu";

        WasmBridge._setTestingInstance(createMockWasmBridge());
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

        // Initially only the vscode api section is expanded
        const cardsBefore = shadow?.querySelectorAll(".card");
        expect(cardsBefore?.length).toBe(4);

        // Search for "leaflet" — exists in the expanded vscode api section
        searchInput.focus();
        searchInput.value = "leaflet";
        searchInput.dispatchEvent(new Event("input"));

        // Wait for microtask (signals batching)
        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Should find exactly 1 match (Leaflet Demo)
        const cardsAfter = shadow?.querySelectorAll(".card");
        expect(cardsAfter?.length).toBe(1);
        expect(cardsAfter[0].textContent).toContain("Leaflet Demo");
    });
});
