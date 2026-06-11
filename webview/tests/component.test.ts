import { beforeEach, describe, expect, it } from "vitest";
import { ExbaComponent, css, defineComponent, html, signal } from "../core/exba";

const [getName, setName] = signal("World");

class TestComponent extends ExbaComponent {
    styles() {
        return css`div { color: red; }`;
    }
    template() {
        return html`<div>Hello ${getName()}</div>`;
    }
}
defineComponent("test-component", TestComponent);

describe("WasmComponent Rendering", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("should render template with initial signal value", () => {
        const el = document.createElement("test-component") as TestComponent;
        document.body.appendChild(el);

        const shadow = el.shadowRoot;
        expect(shadow?.innerHTML).toContain("Hello World");
    });

    it("should update when signal changes", async () => {
        const el = document.createElement("test-component") as TestComponent;
        document.body.appendChild(el);

        setName("Vitest");
        await new Promise((resolve) => queueMicrotask(resolve as any));

        const shadow = el.shadowRoot;
        expect(shadow?.innerHTML).toContain("Hello Vitest");
    });
});
