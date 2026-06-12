import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, signal } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.5rem;
    `,
    inputGroup: (css: any) => css`
        display: flex;
        gap: 0.5rem;
    `,
    inputField: (css: any) => css`
        flex: 1;
        padding: 0.45rem 0.75rem;
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        color: #ffffff;
        font-size: 0.75rem;
        outline: none;
        &:focus {
            border-color: #a78bfa;
        }
    `,
    btn: (css: any) => css`
        background: rgba(167, 139, 250, 0.15);
        border: 1px solid rgba(167, 139, 250, 0.3);
        color: #a78bfa;
        padding: 0.45rem 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        outline: none;
        &:hover {
            background: rgba(167, 139, 250, 0.25);
        }
    `,
    info: (css: any) => css`
        font-size: 0.75rem;
        color: #cbd5e1;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem;
        border-radius: 8px;
        & strong {
            color: #a78bfa;
        }
    `,
};

export class StorageDemo extends ExbaComponent {
    private STORAGE_KEY = "exba_storage_showcase";
    private _inputValue = signal("");
    private _storedValue = signal<string | null>(localStorage.getItem("exba_storage_showcase"));
    private gCss: any;
    private classes!: any;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
            inputGroup: styles.inputGroup(this.gCss),
            inputField: styles.inputField(this.gCss),
            btn: styles.btn(this.gCss),
            info: styles.info(this.gCss),
        };
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    handleInput(e: Event) {
        this._inputValue[1]((e.target as HTMLInputElement).value);
    }

    handleSave() {
        const val = this._inputValue[0]().trim();
        if (!val) return;
        localStorage.setItem(this.STORAGE_KEY, val);
        this._storedValue[1](val);
        this._inputValue[1]("");
    }

    handleClear() {
        localStorage.removeItem(this.STORAGE_KEY);
        this._storedValue[1](null);
    }

    template() {
        const inputVal = this._inputValue[0]();
        const storedVal = this._storedValue[0]();

        return html`
            <div class="${this.classes.container}">
                <div class="${this.classes.inputGroup}">
                    <input 
                        type="text" 
                        class="${this.classes.inputField}" 
                        placeholder="Write something to persist..." 
                        value="${inputVal}"
                        on-input="handleInput"
                        on-change="handleSave"
                    />
                    <button class="${this.classes.btn}" on-click="handleSave">Save</button>
                    <button class="${this.classes.btn}" style="color: #f87171; border-color: rgba(248,113,113,0.3); background: rgba(248,113,113,0.1);" on-click="handleClear">Clear</button>
                </div>
                <div class="${this.classes.info}">
                    Currently Saved: <strong>${storedVal !== null ? storedVal : "(empty)"}</strong>
                </div>
            </div>
        `;
    }
}
defineComponent("exba-storage-demo", StorageDemo);
