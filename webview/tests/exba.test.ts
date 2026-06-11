import { describe, expect, it, vi } from "vitest";
import { batch, effect, memo, signal, untrack } from "../core/exba";

describe("WasmFramework Signals", () => {
    it("should track and update values", () => {
        const [getCount, setCount] = signal(0);
        expect(getCount()).toBe(0);
        setCount(1);
        expect(getCount()).toBe(1);
    });

    it("should trigger effects", async () => {
        const [getCount, setCount] = signal(0);
        const spy = vi.fn();

        effect(() => {
            spy(getCount());
        });

        expect(spy).toHaveBeenCalledWith(0);
        setCount(10);

        // Wait for microtask (batching)
        await new Promise((resolve) => queueMicrotask(resolve as any));
        expect(spy).toHaveBeenCalledWith(10);
    });

    it("should batch multiple updates", async () => {
        const [getCount, setCount] = signal(0);
        const spy = vi.fn();

        effect(() => {
            spy(getCount());
        });

        spy.mockClear();
        setCount(1);
        setCount(2);
        setCount(3);

        await new Promise((resolve) => queueMicrotask(resolve as any));
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(3);
    });

    it("should support memo (derived state)", async () => {
        const [getCount, setCount] = signal(1);
        const doubled = memo(() => getCount() * 2);

        const spy = vi.fn();
        effect(() => spy(doubled()));

        expect(doubled()).toBe(2);
        expect(spy).toHaveBeenCalledWith(2);

        setCount(5);
        await new Promise((resolve) => queueMicrotask(resolve as any));
        expect(doubled()).toBe(10);
        expect(spy).toHaveBeenCalledWith(10);
    });

    it("should not track dependencies inside untrack", async () => {
        const [getCount, setCount] = signal(0);
        const [getOther, setOther] = signal("a");
        const spy = vi.fn();

        effect(() => {
            untrack(() => getCount());
            spy(getOther());
        });

        expect(spy).toHaveBeenCalledWith("a");
        setCount(999);
        await new Promise((resolve) => queueMicrotask(resolve as any));
        expect(spy).toHaveBeenCalledTimes(1);

        setOther("b");
        await new Promise((resolve) => queueMicrotask(resolve as any));
        expect(spy).toHaveBeenCalledTimes(2);
        expect(spy).toHaveBeenCalledWith("b");
    });

    it("should batch updates synchronously with batch()", async () => {
        const [getA, setA] = signal(0);
        const [getB, setB] = signal(0);
        const spy = vi.fn();

        effect(() => {
            spy(getA() + getB());
        });

        spy.mockClear();
        batch(() => {
            setA(10);
            setB(20);
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(30);
    });

    it("should handle nested batch calls", async () => {
        const [getCount, setCount] = signal(0);
        const spy = vi.fn();

        effect(() => {
            spy(getCount());
        });

        spy.mockClear();
        batch(() => {
            setCount(1);
            batch(() => {
                setCount(2);
            });
            setCount(3);
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith(3);
    });
});
