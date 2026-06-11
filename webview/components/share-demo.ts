import { ExbaComponent, defineComponent, html, signal } from "../core/exba";
import { css as gooberCss } from "goober";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.5rem;
    `,
    btn: (css: any) => css`
        background: rgba(167, 139, 250, 0.15);
        border: 1px solid rgba(167, 139, 250, 0.3);
        color: #a78bfa;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        width: fit-content;
        outline: none;
        &:hover {
            background: rgba(167, 139, 250, 0.25);
        }
    `,
    status: (css: any) => css`
        font-size: 0.75rem;
        color: #94a3b8;
        &.success {
            color: #34d399;
        }
    `,
};

export class ShareDemo extends ExbaComponent {
    private _status = signal("");
    private _isSuccess = signal(false);
    private gCss: any;
    private classes!: any;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
            btn: styles.btn(this.gCss),
            status: styles.status(this.gCss),
        };
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    async handleShare() {
        const shareData = {
            title: "EXBA Framework",
            text: "Check out this awesome reactive Web Component framework with Rust WASM!",
            url: "https://github.com/vscode-samples/exba-wasm-vscode-extension",
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this._status[1]("Successfully shared content!");
                this._isSuccess[1](true);
            } catch (err: any) {
                this._status[1](`Share failed or cancelled: ${err.message}`);
                this._isSuccess[1](false);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
                this._status[1]("System share unsupported. Text copied to clipboard!");
                this._isSuccess[1](true);
            } catch (err: any) {
                this._status[1]("Clipboard access denied.");
                this._isSuccess[1](false);
            }
        }
    }

    template() {
        const statusVal = this._status[0]();
        const isSuccessVal = this._isSuccess[0]();

        return html`
            <div class="${this.classes.container}">
                <button class="${this.classes.btn}" on-click="handleShare">Share Framework Link</button>
                ${statusVal ? html`
                    <div class="${this.classes.status}${isSuccessVal ? " success" : ""}">
                        ${statusVal}
                    </div>
                ` : ""}
            </div>
        `;
    }
}
defineComponent("exba-share-demo", ShareDemo);
