import { describe, expect, it } from "vitest";
import { debounce, formatCurrency, formatNumber } from "../core/utils";

describe("Webview Utilities", () => {
    it("should format currency correctly", () => {
        expect(formatCurrency(1234.56)).toBe("$1,234.56");
        expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should format numbers correctly", () => {
        expect(formatNumber(1234.56)).toBe("1,235"); // Default rounds
        expect(formatNumber(1234.56, 2)).toBe("1,234.56");
    });

    it("should debounce function calls", async () => {
        let count = 0;
        const fn = debounce(() => {
            count++;
        }, 10);

        fn();
        fn();
        fn();

        expect(count).toBe(0);

        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(count).toBe(1);
    });
});
