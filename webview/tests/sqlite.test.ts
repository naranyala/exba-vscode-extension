import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();

vi.mock("sql.js", () => {
    return {
        default: async () => ({
            Database: class {
                constructor() {}
                exec(sql: string) {
                    if (sql.includes("SYNTAX ERROR")) {
                        throw new Error("near \"SYNTAX\": syntax error");
                    }
                    if (sql.includes("sqlite_master")) {
                        return [{ columns: ["name"], values: [["users"], ["products"]] }];
                    }
                    if (sql.includes("users")) {
                        return [{ columns: ["id", "name"], values: [[1, "Alice"], [2, "Bob"]] }];
                    }
                    if (sql.includes("products")) {
                        return [{ columns: ["id", "item"], values: [[101, "Keyboard"]] }];
                    }
                    return [];
                }
                run(sql: string) {}
                export() {
                    return new Uint8Array([1, 2, 3, 4]);
                }
                close() {}
            }
        })
    };
});

describe("SQLite Explorer Component", () => {
    let sqliteApp: any;
    let shadow: ShadowRoot;

    beforeEach(async () => {
        document.body.innerHTML = '<div id="app-root"></div>';
        document.body.dataset.sqlWasmUri = "mock-wasm.wasm";

        await import("../components/sqlite-demo");

        const appRoot = document.getElementById("app-root");
        sqliteApp = document.createElement("exba-sqlite-demo");
        appRoot?.appendChild(sqliteApp);

        await new Promise((resolve) => setTimeout(resolve, 50));
        shadow = sqliteApp.shadowRoot as ShadowRoot;
        expect(shadow).not.toBeNull();
    });

    it("should initialize and load demo database", async () => {
        const loadDemoBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Load Demo DB"));
        (loadDemoBtn as HTMLButtonElement).click();

        await new Promise((resolve) => queueMicrotask(resolve as any));

        const tableBadges = shadow.querySelectorAll("span[data-table]");
        expect(tableBadges?.length).toBe(2);
        
        const ths = shadow.querySelectorAll("th");
        expect(ths?.[0].textContent).toBe("id");
    });

    it("should display results when a table badge is clicked", async () => {
        const loadDemoBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Load Demo DB"));
        (loadDemoBtn as HTMLButtonElement).click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Click the 'products' badge
        const productsBadge = Array.from(shadow.querySelectorAll("span[data-table]")).find((b) => b.textContent === "products");
        (productsBadge as HTMLElement).click();

        await new Promise((resolve) => queueMicrotask(resolve as any));

        const ths = shadow.querySelectorAll("th");
        expect(ths?.length).toBe(2);
        expect(ths?.[1].textContent).toBe("item"); // Column from 'products' table mock

        const tds = shadow.querySelectorAll("td");
        expect(tds?.[1].textContent?.trim()).toBe("Keyboard");
    });

    it("should execute custom queries from the text area", async () => {
        const loadDemoBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Load Demo DB"));
        (loadDemoBtn as HTMLButtonElement).click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        const textarea = shadow.querySelector("textarea") as HTMLTextAreaElement;
        textarea.value = "SELECT * FROM products;";
        textarea.dispatchEvent(new Event("input"));

        const runQueryBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Run Query"));
        (runQueryBtn as HTMLButtonElement).click();

        await new Promise((resolve) => queueMicrotask(resolve as any));

        const tds = shadow.querySelectorAll("td");
        expect(tds?.[1].textContent?.trim()).toBe("Keyboard");
    });

    it("should handle SQL errors gracefully", async () => {
        const loadDemoBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Load Demo DB"));
        (loadDemoBtn as HTMLButtonElement).click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        const textarea = shadow.querySelector("textarea") as HTMLTextAreaElement;
        textarea.value = "SYNTAX ERROR";
        textarea.dispatchEvent(new Event("input"));

        const runQueryBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Run Query"));
        (runQueryBtn as HTMLButtonElement).click();

        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Should display error message
        const errorDiv = Array.from(shadow.querySelectorAll("div")).find(div => div.textContent?.includes("near \"SYNTAX\": syntax error"));
        expect(errorDiv).toBeDefined();

        // Tables should be empty
        const tds = shadow.querySelectorAll("td");
        expect(tds?.length).toBe(0);
    });

    it("should trigger export successfully", async () => {
        const loadDemoBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Load Demo DB"));
        (loadDemoBtn as HTMLButtonElement).click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Mock anchor click
        const clickSpy = vi.fn();
        const originalCreateElement = document.createElement.bind(document);
        vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return { click: clickSpy } as any;
            }
            return originalCreateElement(tagName);
        });

        const exportBtn = Array.from(shadow.querySelectorAll("button")).find((b) => b.textContent?.includes("Save / Export"));
        (exportBtn as HTMLButtonElement).click();

        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(clickSpy).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith("mock-url");

        vi.restoreAllMocks();
    });

    it("should handle manual file upload", async () => {
        const fileInput = shadow.querySelector("input[type='file']") as HTMLInputElement;
        expect(fileInput).not.toBeNull();

        // Mock FileReader
        const originalFileReader = global.FileReader;
        class MockFileReader {
            onload: any;
            result: ArrayBuffer;
            constructor() {
                this.result = new ArrayBuffer(0);
            }
            readAsArrayBuffer(file: File) {
                this.result = new ArrayBuffer(10);
                if (this.onload) this.onload({} as Event);
            }
        }
        global.FileReader = MockFileReader as any;

        const file = new File(["test data"], "test.sqlite", { type: "application/x-sqlite3" });
        
        // Use Object.defineProperty to mock the files property getter
        Object.defineProperty(fileInput, 'files', {
            value: [file]
        });

        fileInput.dispatchEvent(new Event("change"));

        await new Promise((resolve) => queueMicrotask(resolve as any));

        // The mock will set up a new db and list tables
        const tableBadges = shadow.querySelectorAll("span[data-table]");
        expect(tableBadges?.length).toBe(2);

        global.FileReader = originalFileReader;
    });
});
