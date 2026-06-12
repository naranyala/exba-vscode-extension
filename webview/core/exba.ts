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
 * Runs a function without tracking any signal dependencies.
 * Useful when you need to read a signal inside an effect without re-subscribing.
 */
export function untrack<T>(fn: () => T): T {
    dependencyTracker.push(null as any);
    try {
        return fn();
    } finally {
        dependencyTracker.pop();
    }
}

/**
 * Groups multiple signal updates and flushes them synchronously at the end.
 * All effects triggered by updates inside the batch run exactly once after fn returns.
 */
export function batch(fn: () => void): void {
    if (isBatching) {
        fn();
        return;
    }
    isBatching = true;
    try {
        fn();
    } finally {
        isBatching = false;
        const effects = Array.from(pendingEffects);
        pendingEffects.clear();
        for (const effect of effects) {
            effect();
        }
    }
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
 * Lifecycle hook: runs after each render (DOM patch) completes.
 * Use this instead of setTimeout(fn, 0) / requestAnimationFrame
 * when you need the DOM to exist (third-party libs, refs, etc).
 */
export function onAfterRender(fn: () => void) {
    if (currentComponent) {
        currentComponent._addAfterRenderHook(fn);
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
 * Helper recursively patches child nodes of DOM elements.
 * Preserves activeElement (focused element) to prevent losing cursor position/focus.
 */
function patchNode(oldNode: Node, newNode: Node, activeElement: Element | null): boolean {
    if (oldNode.nodeType !== newNode.nodeType) {
        oldNode.replaceWith(newNode.cloneNode(true));
        return true;
    }

    if (oldNode.nodeType === Node.TEXT_NODE) {
        if (oldNode.textContent !== newNode.textContent) {
            oldNode.textContent = newNode.textContent;
            return true;
        }
        return false;
    }

    if (oldNode.nodeType === Node.ELEMENT_NODE) {
        const oldEl = oldNode as Element;
        const newEl = newNode as Element;

        if (oldEl.tagName !== newEl.tagName) {
            oldEl.replaceWith(newEl.cloneNode(true));
            return true;
        }

        const isActive = oldEl === activeElement || oldEl.contains(activeElement);

        // Skip updating if outerHTML is exactly identical and it doesn't contain the active element
        if (oldEl.outerHTML === newEl.outerHTML && !isActive) {
            return false;
        }

        let hasChanges = false;

        // Sync attributes from newEl to oldEl
        for (const attr of Array.from(oldEl.attributes)) {
            if (!newEl.hasAttribute(attr.name)) {
                oldEl.removeAttribute(attr.name);
                hasChanges = true;
            }
        }
        for (const attr of Array.from(newEl.attributes)) {
            if (oldEl.getAttribute(attr.name) !== attr.value) {
                oldEl.setAttribute(attr.name, attr.value);
                hasChanges = true;
            }
        }

        // Sync child nodes recursively
        const oldChildren = Array.from(oldEl.childNodes);
        const newChildren = Array.from(newEl.childNodes);
        const maxLen = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < maxLen; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];

            if (!oldChild && newChild) {
                oldEl.appendChild(newChild.cloneNode(true));
                hasChanges = true;
            } else if (oldChild && !newChild) {
                oldChild.remove();
                hasChanges = true;
            } else if (oldChild && newChild) {
                const childChanged = patchNode(oldChild, newChild, activeElement);
                if (childChanged) hasChanges = true;
            }
        }

        return hasChanges;
    }

    return false;
}

/**
 * Handles DOM reconciliation and declarative event binding.
 */
const DOMRenderer = {
    render(shadow: ShadowRoot, content: string, component: ExbaComponent) {
        const activeElement = shadow.activeElement as HTMLInputElement;

        // Parse content
        const temp = document.createElement("div");
        temp.innerHTML = content;

        // Patch only the template children, skipping the style tag at index 0 and ignoring any goober style tags
        const oldChildren = Array.from(shadow.childNodes)
            .slice(1)
            .filter((node) => {
                const el = node as Element;
                return el.tagName !== "STYLE" || el.id !== "_goober";
            });
        const newChildren = Array.from(temp.childNodes);
        const maxLen = Math.max(oldChildren.length, newChildren.length);

        for (let i = 0; i < maxLen; i++) {
            const oldChild = oldChildren[i];
            const newChild = newChildren[i];

            if (!oldChild && newChild) {
                shadow.appendChild(newChild.cloneNode(true));
            } else if (oldChild && !newChild) {
                oldChild.remove();
            } else if (oldChild && newChild) {
                patchNode(oldChild, newChild, activeElement);
            }
        }

        // 1. Synchronize input element properties for non-active elements
        const inputs = shadow.querySelectorAll("input, select, textarea");
        for (const el of Array.from(inputs)) {
            const inputEl = el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const valAttr = inputEl.getAttribute("value");
            if (valAttr !== null && inputEl !== activeElement) {
                inputEl.value = valAttr;
            }
        }

        // 2. Discover and bind declarative event handlers and boolean attributes
        const allElements = shadow.querySelectorAll("*");
        for (const el of Array.from(allElements)) {
            for (const attr of Array.from(el.attributes)) {
                if (attr.name.startsWith("on-")) {
                    const eventName = attr.name.slice(3);
                    const handlerName = attr.value;
                    const handler = (component as any)[handlerName];

                    if (typeof handler === "function") {
                        const key = `__exba_bound_${eventName}`;
                        if (!(el as any)[key]) {
                            el.addEventListener(eventName, (e) => handler.call(component, e));
                            (el as any)[key] = true;
                        }
                    }
                    el.removeAttribute(attr.name);
                } else if (attr.name.startsWith("?")) {
                    const realAttr = attr.name.slice(1);
                    if (attr.value === "true" || attr.value === "") {
                        el.setAttribute(realAttr, "");
                    } else {
                        el.removeAttribute(realAttr);
                    }
                    el.removeAttribute(attr.name);
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
    private _mountHooks: (() => undefined | Cleanup)[] = [];
    private _cleanupHooks: Cleanup[] = [];
    private _stopEffect: Cleanup | null = null;
    private _afterRenderHooks: (() => void)[] = [];
    _errorHandler: ((err: unknown) => void) | null = null;

    _addAfterRenderHook(fn: () => void) {
        this._afterRenderHooks.push(fn);
    }

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

    static async initWasm(wasmUri: string, debug = false): Promise<void> {
        const { WasmBridge } = await import("./wasm-bridge");
        await WasmBridge.instance.init({ wasmUri, debug });
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
        try {
            let styleEl = this.shadow.querySelector("style:not(#_goober)");
            if (!styleEl) {
                styleEl = document.createElement("style");
                styleEl.textContent = this.styles();
                this.shadow.prepend(styleEl);
            } else {
                const newStyles = this.styles();
                if (styleEl.textContent !== newStyles) {
                    styleEl.textContent = newStyles;
                }
            }

            DOMRenderer.render(this.shadow, this.template(), this);

            const hooks = this._afterRenderHooks;
            this._afterRenderHooks = [];
            for (const hook of hooks) {
                currentComponent = this;
                try {
                    hook();
                } finally {
                    currentComponent = null;
                }
            }
        } catch (err) {
            const handler = this._errorHandler ?? errorHandler;
            if (handler) {
                handler(err);
            } else {
                console.error("[ExbaComponent] Render error:", err);
            }
        }
    }
}

// ── Keyed list reconciliation ─────────────────────────────────────

export interface ListTransitionHooks<T> {
    onEnter?: (el: HTMLElement, item: T, index: number) => void;
    onLeave?: (el: HTMLElement, item: T) => void;
}

function reconcileList<T>(
    container: HTMLElement,
    items: T[],
    keyFn: (item: T) => string,
    renderItem: (item: T, index: number) => HTMLElement,
    transition?: ListTransitionHooks<T>,
) {
    const oldKeys = new Map<string, { el: HTMLElement; item: T }>();
    for (let i = 0; i < container.children.length; i++) {
        const child = container.children[i] as HTMLElement;
        const key = child.dataset.key;
        if (key) oldKeys.set(key, { el: child, item: (child as any).__listItem });
    }

    const newKeySet = new Set<string>();

    for (let i = 0; i < items.length; i++) {
        const key = keyFn(items[i]);
        newKeySet.add(key);

        const entry = oldKeys.get(key);
        let el: HTMLElement;

        if (entry) {
            oldKeys.delete(key);
            el = entry.el;
            const newEl = renderItem(items[i], i);
            el.replaceChildren(...newEl.childNodes);
            for (const attr of Array.from(newEl.attributes)) {
                el.setAttribute(attr.name, attr.value);
            }
            el.dataset.key = key;
        } else {
            el = renderItem(items[i], i);
            el.dataset.key = key;
            if (transition?.onEnter) {
                transition.onEnter(el, items[i], i);
            }
        }
        (el as any).__listItem = items[i];

        const targetIndex = i;
        const currentIndex = Array.from(container.children).indexOf(el);
        if (currentIndex !== targetIndex) {
            const ref = container.children[targetIndex + 1] || null;
            container.insertBefore(el, ref);
        } else if (!el.parentNode) {
            container.appendChild(el);
        }
    }

    for (const [, entry] of oldKeys) {
        if (transition?.onLeave) {
            transition.onLeave(entry.el, entry.item);
        }
        entry.el.remove();
    }
}

export function createList<T>(
    getItems: () => T[],
    keyFn: (item: T) => string,
    renderItem: (item: T, index: number) => HTMLElement,
    getContainer: () => HTMLElement | null,
    transition?: ListTransitionHooks<T>,
): Cleanup {
    return effect(() => {
        const container = getContainer();
        if (!container) return;
        const items = getItems();
        reconcileList(container, items, keyFn, renderItem, transition);
    });
}

// ── Conditional rendering ─────────────────────────────────────────

export interface ShowTransitionHooks {
    onEnter?: (el: HTMLElement) => void;
    onLeave?: (el: HTMLElement) => void;
}

export function createShow(
    getWhen: () => boolean,
    renderContent: () => HTMLElement,
    getContainer: () => HTMLElement | null,
    renderFallback?: () => HTMLElement,
    transition?: ShowTransitionHooks,
): Cleanup {
    let currentEl: HTMLElement | null = null;
    let currentState: boolean | null = null;
    return effect(() => {
        const container = getContainer();
        if (!container) return;
        const show = getWhen();
        if (show === currentState && currentEl?.parentNode === container) return;
        currentState = show;
        if (currentEl) {
            if (transition?.onLeave) transition.onLeave(currentEl);
            currentEl.remove();
        }
        currentEl = show ? renderContent() : (renderFallback?.() ?? document.createElement("div"));
        container.appendChild(currentEl);
        if (transition?.onEnter) transition.onEnter(currentEl);
    });
}

export function createSwitch(
    getKey: () => string,
    cases: Record<string, () => HTMLElement>,
    getContainer: () => HTMLElement | null,
    renderFallback?: () => HTMLElement,
    transition?: ShowTransitionHooks,
): Cleanup {
    let currentEl: HTMLElement | null = null;
    let currentKey: string | null = null;
    return effect(() => {
        const container = getContainer();
        if (!container) return;
        const key = getKey();
        if (key === currentKey && currentEl?.parentNode === container) return;
        currentKey = key;
        if (currentEl) {
            if (transition?.onLeave) transition.onLeave(currentEl);
            currentEl.remove();
        }
        const renderFn = cases[key] ?? renderFallback;
        currentEl = renderFn ? renderFn() : document.createElement("div");
        container.appendChild(currentEl);
        if (transition?.onEnter) transition.onEnter(currentEl);
    });
}

// ── Two-way binding ───────────────────────────────────────────────

export function createModel(
    getValue: () => string,
    setValue: (v: string) => void,
    getInput: () => HTMLInputElement | HTMLTextAreaElement | null,
): Cleanup {
    return effect(() => {
        const input = getInput();
        if (!input) return;
        const val = getValue();
        if (input !== document.activeElement && input.value !== val) {
            input.value = val;
        }
        const handler = (e: Event) => {
            setValue((e.target as HTMLInputElement).value);
        };
        input.addEventListener("input", handler);
        return () => input.removeEventListener("input", handler);
    });
}

// ── Context / Dependency Injection ─────────────────────────────────

export interface Context<T> {
    id: symbol;
    defaultValue: T;
}

const contextValues = new Map<symbol, any>();

export function createContext<T>(defaultValue: T): Context<T> {
    return { id: Symbol("context"), defaultValue };
}

export function provideContext<T>(context: Context<T>, value: T): void {
    contextValues.set(context.id, value);
}

export function useContext<T>(context: Context<T>): T {
    return contextValues.get(context.id) ?? context.defaultValue;
}

let errorHandler: ((err: unknown) => void) | null = null;

export function onError(handler: (err: unknown) => void): void {
    if (currentComponent) {
        currentComponent._errorHandler = handler;
    } else {
        errorHandler = handler;
    }
}

export function reportError(err: unknown): void {
    const handler = currentComponent?._errorHandler ?? errorHandler;
    if (handler) {
        handler(err);
    } else {
        console.error(err);
    }
}

// ── DOM Ref ───────────────────────────────────────────────────────

export function useRef<T extends HTMLElement = HTMLElement>(
    getContainer: () => HTMLElement | null,
    selector: string,
): () => T | null {
    return () => getContainer()?.querySelector<T>(selector) ?? null;
}

// ── Deferred value (debounce updates) ──────────────────────────────

export function createDeferred<T>(getValue: () => T, delayMs = 150): () => T {
    const [getDeferred, setDeferred] = signal<T>(getValue());
    let timeout: ReturnType<typeof setTimeout> | null = null;
    effect(() => {
        const val = getValue();
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            setDeferred(val);
            timeout = null;
        }, delayMs);
        return () => {
            if (timeout) clearTimeout(timeout);
        };
    });
    return getDeferred;
}

// ── Portal (teleport content to a different DOM location) ──────────

const portalRoots = new Map<string, HTMLElement>();

export function registerPortal(name: string, el: HTMLElement): void {
    portalRoots.set(name, el);
}

export function unregisterPortal(name: string): void {
    portalRoots.delete(name);
}

export function createPortal(getContent: () => HTMLElement, portalName: () => string): Cleanup {
    return effect(() => {
        const root = portalRoots.get(portalName());
        if (!root) return;
        const el = getContent();
        root.appendChild(el);
        return () => el.remove();
    });
}

// ── Async resource (loading / error / success states) ─────────────

export type ResourceState<T> =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; error: string }
    | { status: "ready"; data: T };

export function createResource<T>(fetcher: () => Promise<T>): [() => ResourceState<T>, () => void] {
    const [getState, setState] = signal<ResourceState<T>>({ status: "idle" });

    const load = () => {
        setState({ status: "loading" });
        fetcher()
            .then((data) => setState({ status: "ready", data }))
            .catch((err) =>
                setState({
                    status: "error",
                    error: err instanceof Error ? err.message : String(err),
                }),
            );
    };

    return [getState, load];
}
