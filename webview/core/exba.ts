/**
 * EXBA (Extended Browser API) - A reactive, lightweight WebAssembly-integrated framework.
 */

type Subscriber = () => void;
type Cleanup = () => void;

const dependencyTracker: Subscriber[] = [];
const pendingEffects = new Set<Subscriber>();
let isBatching = false;

/**
 * Batches multiple signal updates into a single microtask to prevent redundant re-renders.
 */
function scheduleEffect(effect: Subscriber) {
    pendingEffects.add(effect);
    if (!isBatching) {
        isBatching = true;
        queueMicrotask(() => {
            const effects = Array.from(pendingEffects);
            pendingEffects.clear();
            isBatching = false;
            for (const fn of effects) {
                fn();
            }
        });
    }
}

/**
 * Creates a reactive signal.
 */
export function signal<T>(initialValue: T) {
    let value = initialValue;
    const subscribers = new Set<Subscriber>();

    const getter = () => {
        const active = dependencyTracker[dependencyTracker.length - 1];
        if (active) subscribers.add(active);
        return value;
    };

    const setter = (newValue: T) => {
        if (value !== newValue) {
            value = newValue;
            subscribers.forEach(scheduleEffect);
        }
    };

    return [getter, setter] as const;
}

/**
 * Creates a derived reactive value (memo).
 * Only re-calculates when its dependencies change.
 */
export function memo<T>(fn: () => T) {
    const [getValue, setValue] = signal<T>(undefined as any);
    effect(() => {
        setValue(fn());
    });
    return getValue;
}

/**
 * Runs a side effect and tracks its dependencies.
 * Returns a function to stop the effect.
 */
export function effect(fn: () => undefined | Cleanup): Cleanup {
    let cleanup: Cleanup | undefined;
    const runner = () => {
        if (cleanup) cleanup();
        dependencyTracker.push(runner);
        try {
            cleanup = fn();
        } finally {
            dependencyTracker.pop();
        }
    };
    runner();
    return () => {
        if (cleanup) cleanup();
        pendingEffects.delete(runner);
    };
}

/**
 * Lifecycle hook: runs when the component is mounted to the DOM.
 */
let currentComponent: ExbaComponent | null = null;
export function onMount(fn: () => undefined | Cleanup) {
    if (currentComponent) {
        currentComponent.addMountHook(fn);
    }
}

/**
 * Lifecycle hook: runs when the component is removed from the DOM.
 */
export function onCleanup(fn: Cleanup) {
    if (currentComponent) {
        currentComponent.addCleanupHook(fn);
    }
}

/**
 * Tagged template helpers for syntax highlighting and string interpolation.
 */
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");

export const css = html;

/**
 * Utility to register a component with the custom framework.
 */
export function defineComponent(tagName: string, componentClass: any) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, componentClass);
    }
}

/**
 * Handles DOM reconciliation and declarative event binding.
 */
const DOMRenderer = {
    render(shadow: ShadowRoot, content: string, component: ExbaComponent) {
        const activeElementId = shadow.activeElement?.id;
        const selectionStart = (shadow.activeElement as HTMLInputElement)?.selectionStart;
        const selectionEnd = (shadow.activeElement as HTMLInputElement)?.selectionEnd;

        // Efficiently update only the content part if needed (naive innerHTML for now)
        shadow.innerHTML = content;

        // 1. Synchronize input element properties
        const inputs = shadow.querySelectorAll("input, select, textarea");
        for (const el of Array.from(inputs)) {
            const inputEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const valAttr = inputEl.getAttribute("value");
            if (valAttr !== null) {
                inputEl.value = valAttr;
            }
        }

        // 2. Discover and bind declarative event handlers
        const allElements = shadow.querySelectorAll("*");
        for (const el of Array.from(allElements)) {
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith("on-")) {
                    const eventName = attr.name.slice(3);
                    const handlerName = attr.value;
                    const handler = (component as any)[handlerName];

                    if (typeof handler === "function") {
                        el.addEventListener(eventName, (e) => handler.call(component, e));
                    }
                    el.removeAttribute(attr.name);
                }
            }
        }

        // 3. Restore focus and selection
        if (activeElementId) {
            const el = shadow.getElementById(activeElementId) as HTMLInputElement;
            if (el) {
                el.focus();
                if (
                    selectionStart !== null &&
                    selectionEnd !== null &&
                    (el.type === "text" || el.type === "search")
                ) {
                    el.setSelectionRange(selectionStart, selectionEnd);
                }
            }
        }
    },
};

/**
 * ExbaComponent - A reactive, lightweight Web Component base class.
 */
export abstract class ExbaComponent extends HTMLElement {
    protected shadow: ShadowRoot;
    protected static wasm: any;
    private _mountHooks: (() => undefined | Cleanup)[] = [];
    private _cleanupHooks: Cleanup[] = [];
    private _stopEffect: Cleanup | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    /**
     * Define internal styles for the component.
     */
    styles(): string {
        return "";
    }

    /**
     * Define the HTML template for the component.
     */
    abstract template(): string;

    /**
     * Helper to create a reactive signal from an attribute.
     */
    protected createAttrSignal(attrName: string, defaultValue: string) {
        const [get, set] = signal(this.getAttribute(attrName) || defaultValue);

        // Observe attribute changes manually (since we don't want to force observedAttributes overhead)
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "attributes" && mutation.attributeName === attrName) {
                    set(this.getAttribute(attrName) || defaultValue);
                }
            }
        });

        onMount(() => {
            observer.observe(this, { attributes: true });
            return () => observer.disconnect();
        });

        return get;
    }

    addMountHook(fn: () => undefined | Cleanup) {
        this._mountHooks.push(fn);
    }

    addCleanupHook(fn: Cleanup) {
        this._cleanupHooks.push(fn);
    }

    static async initWasm(wasmUri: string): Promise<void> {
        if (!ExbaComponent.wasm) {
            const response = await fetch(wasmUri);
            const buffer = await response.arrayBuffer();

            const importObject = {
                env: {
                    js_log: (ptr: number, len: number) => {
                        const wasm = ExbaComponent.wasm;
                        const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
                        const message = new TextDecoder("utf-8").decode(memory);
                        console.log(`[RUST] ${message}`);
                    },
                },
            };

            const { instance } = await WebAssembly.instantiate(buffer, importObject);
            ExbaComponent.wasm = instance.exports;
        }
    }

    protected getWasmString(): string {
        const wasm = ExbaComponent.wasm;
        if (!wasm) throw new Error("WASM engine is not initialized");
        const ptr = wasm.get_result_ptr();
        const len = wasm.get_result_len();
        const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
        return new TextDecoder("utf-8").decode(memory);
    }

    connectedCallback() {
        currentComponent = this;

        // Register hooks from template and styles execution
        this.styles();
        this.template();

        for (const hook of this._mountHooks) {
            const cleanup = hook();
            if (typeof cleanup === "function") this._cleanupHooks.push(cleanup);
        }

        this._stopEffect = effect(() => {
            this.render();
        });

        currentComponent = null;
    }

    disconnectedCallback() {
        if (this._stopEffect) this._stopEffect();
        for (const cleanup of this._cleanupHooks) {
            cleanup();
        }
        this._mountHooks = [];
        this._cleanupHooks = [];
    }

    private render() {
        const fullContent = html`
            <style>${this.styles()}</style>
            ${this.template()}
        `;
        DOMRenderer.render(this.shadow, fullContent, this);
    }
}
