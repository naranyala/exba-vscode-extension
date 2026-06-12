import { ExbaComponent, defineComponent, html, onMount, signal } from "../core/exba";
import { WasmBridge } from "../core/wasm-bridge";

export class FormatDemo extends ExbaComponent {
    private _input = signal("");
    private _output = signal("");
    private _error = signal("");

    handleInput(e: Event) {
        this._input[1]((e.target as HTMLInputElement).value);
    }

    handleFormat() {
        const text = this._input[0]().trim();
        if (!text) return;
        try {
            const result = WasmBridge.instance.formatText(text);
            this._output[1](JSON.stringify(result, null, 2));
            this._error[1]("");
        } catch (err) {
            this._output[1]("");
            this._error[1](err instanceof Error ? err.message : String(err));
        }
    }

    styles() {
        return `
            :host { display: block; }
            .container { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.5rem; }
            .input-field {
                padding: 0.45rem 0.75rem;
                background: rgba(15, 23, 42, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #fff;
                font-size: 0.75rem;
                outline: none;
                font-family: inherit;
            }
            .input-field:focus { border-color: #a78bfa; }
            .btn {
                background: rgba(167, 139, 250, 0.15);
                border: 1px solid rgba(167, 139, 250, 0.3);
                color: #a78bfa;
                padding: 0.45rem 1rem;
                border-radius: 8px;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                width: fit-content;
                outline: none;
            }
            .btn:hover { background: rgba(167, 139, 250, 0.25); }
            .output {
                background: rgba(15, 23, 42, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                padding: 0.75rem;
                font-family: monospace;
                font-size: 0.7rem;
                color: #a5b4fc;
                white-space: pre-wrap;
                min-height: 80px;
            }
            .error { color: #f87171; font-size: 0.75rem; }
        `;
    }

    template() {
        return html`
            <div class="container">
                <input class="input-field" placeholder="Enter text to format..." value="${this._input[0]()}" on-input="handleInput" />
                <button class="btn" on-click="handleFormat">Format via WASM</button>
                ${this._error[0]() ? html`<div class="error">${this._error[0]()}</div>` : ""}
                ${this._output[0]() ? html`<div class="output">${this._output[0]()}</div>` : ""}
            </div>
        `;
    }
}
defineComponent("exba-format-demo", FormatDemo);
