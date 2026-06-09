/**
 * A simple signal-based reactivity system.
 */
let dependencyTracker: (() => void)[] = [];

export function signal<T>(initialValue: T) {
    let value = initialValue;
    const subscribers = new Set<() => void>();

    const getter = () => {
        if (dependencyTracker.length > 0) {
            subscribers.add(dependencyTracker[dependencyTracker.length - 1]);
        }
        return value;
    };

    const setter = (newValue: T) => {
        if (value !== newValue) {
            value = newValue;
            subscribers.forEach((cb) => cb());
        }
    };

    return [getter, setter] as const;
}

export function effect(fn: () => void) {
    const runner = () => {
        dependencyTracker.push(runner);
        try {
            fn();
        } finally {
            dependencyTracker.pop();
        }
    };
    runner();
}

/**
 * Handles DOM reconciliation, event delegation, and input synchronization.
 */
class DOMRenderer {
    static render(shadow: ShadowRoot, html: string, component: WasmComponent) {
        // Track the currently focused element inside shadow root
        const activeElementId = shadow.activeElement?.id;
        const selectionStart = (shadow.activeElement as HTMLInputElement)?.selectionStart;
        const selectionEnd = (shadow.activeElement as HTMLInputElement)?.selectionEnd;

        // Apply new template HTML
        shadow.innerHTML = html;

        // 1. Synchronize input element properties
        const inputs = shadow.querySelectorAll("input, select, textarea");
        for (const el of Array.from(inputs)) {
            const inputEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const valAttr = inputEl.getAttribute("value");
            if (valAttr !== null) {
                inputEl.value = valAttr;
            }
        }

        // 2. Discover and bind declarative event handlers (attributes starting with 'on-')
        const allElements = shadow.querySelectorAll("*");
        for (const el of Array.from(allElements)) {
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith("on-")) {
                    const eventName = attr.name.slice(3); // e.g., "click" from "on-click"
                    const handlerName = attr.value;
                    const handler = (component as any)[handlerName];

                    if (typeof handler === "function") {
                        el.addEventListener(eventName, (e) => handler.call(component, e));
                    }
                    el.removeAttribute(attr.name);
                }
            }
        }

        // 3. Restore focus and selection positions
        if (activeElementId) {
            const el = shadow.getElementById(activeElementId) as HTMLInputElement;
            if (el) {
                el.focus();
                if (selectionStart !== null && selectionEnd !== null && (el.type === "text" || el.type === "search")) {
                    el.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
    }
}

/**
 * WasmComponent - A reactive, lightweight Web Component base class
 * that integrates with a WebAssembly core engine and uses signal-based reactivity.
 */
export abstract class WasmComponent extends HTMLElement {
    protected shadow: ShadowRoot;
    protected static wasm: any;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    /**
     * Initializes the WebAssembly module instance for all components.
     */
    static async initWasm(wasmUri: string): Promise<void> {
        if (!WasmComponent.wasm) {
            const response = await fetch(wasmUri);
            const buffer = await response.arrayBuffer();

            const importObject = {
                env: {
                    js_log: (ptr: number, len: number) => {
                        const wasm = WasmComponent.wasm;
                        const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
                        const message = new TextDecoder("utf-8").decode(memory);
                        console.log(`[RUST] ${message}`);
                    },
                },
            };

            const { instance } = await WebAssembly.instantiate(buffer, importObject);
            WasmComponent.wasm = instance.exports;
        }
    }

    /**
     * Helper to read string results out of the Rust WASM shared memory buffer.
     */
    protected getWasmString(): string {
        const wasm = WasmComponent.wasm;
        if (!wasm) throw new Error("WASM engine is not initialized");

        const ptr = wasm.get_result_ptr();
        const len = wasm.get_result_len();
        const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
        return new TextDecoder("utf-8").decode(memory);
    }

    /**
     * Web Component lifecycle: called when the element is connected to the document's DOM.
     * Starts the reactive rendering effect.
     */
    connectedCallback() {
        effect(() => {
            this.render();
        });
    }

    /**
     * Renders the component template and binds events.
     */
    private render() {
        DOMRenderer.render(this.shadow, this.template(), this);
    }

    /**
     * Abstract template method returning the component's HTML markup string.
     */
    abstract template(): string;
}
