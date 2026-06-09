export abstract class WasmComponent extends HTMLElement {
    protected shadow: ShadowRoot;
    protected static wasm: any;
    private updatePending = false;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    /**
     * Initializes the WebAssembly module instance for all components.
     */
    static async initWasm(wasmUri: string): Promise<void> {
        if (!WasmComponent.wasm) {
            const response = await fetch(wasmUri);
            const buffer = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(buffer);
            WasmComponent.wasm = instance.exports;
        }
    }

    /**
     * Helper to read string results out of the Rust WASM shared memory buffer.
     */
    protected getWasmString(): string {
        const wasm = WasmComponent.wasm;
        if (!wasm) throw new Error('WASM engine is not initialized');
        
        const ptr = wasm.get_result_ptr();
        const len = wasm.get_result_len();
        const memory = new Uint8Array(wasm.memory.buffer, ptr, len);
        return new TextDecoder('utf-8').decode(memory);
    }

    /**
     * Creates a reactive proxy state. Any changes to the state object
     * automatically schedules a batched visual re-render.
     */
    protected createState<T extends object>(initialState: T): T {
        return new Proxy(initialState, {
            set: (target, prop, value) => {
                if ((target as any)[prop] !== value) {
                    (target as any)[prop] = value;
                    this.scheduleUpdate();
                }
                return true;
            }
        });
    }

    /**
     * Schedules a re-render in the next animation frame to batch multiple state updates.
     */
    private scheduleUpdate() {
        if (this.updatePending) return;
        this.updatePending = true;
        requestAnimationFrame(() => {
            this.render();
            this.updatePending = false;
        });
    }

    // Components extending this must implement rendering logic
    abstract render(): void;
}
