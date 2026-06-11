import { ExbaComponent, defineComponent, html } from "../core/exba";
import { css as gooberCss } from "goober";
import { getGrowth, setGrowth } from "./state";

const styles = {
    host: (css: any) => css`
        background: rgba(15, 23, 42, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 1.25rem;
    `,
    title: (css: any) => css`
        font-size: 0.8rem;
        font-weight: 800;
        color: #94a3b8;
        margin-bottom: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
    `,
    row: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        & input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 999px;
            background: #334155;
            outline: none;
        }
        & input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: #a78bfa;
            cursor: pointer;
        }
    `,
    rowHeader: (css: any) => css`
        display: flex;
        justify-content: space-between;
        font-size: 0.85rem;
    `,
    label: (css: any) => css`
        color: #cbd5e1;
    `,
    value: (css: any) => css`
        color: #a78bfa;
        font-family: monospace;
        font-weight: 700;
    `,
};

export class SettingsPanel extends ExbaComponent {
    private gCss: any;
    private classes!: {
        host: string;
        title: string;
        row: string;
        rowHeader: string;
        label: string;
        value: string;
    };

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.initStyles();
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    private initStyles() {
        this.classes = {
            host: styles.host(this.gCss),
            title: styles.title(this.gCss),
            row: styles.row(this.gCss),
            rowHeader: styles.rowHeader(this.gCss),
            label: styles.label(this.gCss),
            value: styles.value(this.gCss),
        };
    }

    handleGrowth(e: Event) {
        setGrowth(Number.parseInt((e.target as HTMLInputElement).value));
    }

    template() {
        const growth = getGrowth();
        return html`
            <div class="${this.classes.host}">
                <div class="${this.classes.title}">Config Engine</div>
                <div class="${this.classes.row}">
                    <div class="${this.classes.rowHeader}">
                        <span class="${this.classes.label}">Target Growth</span>
                        <span class="${this.classes.value}">+${growth}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="1"
                        value="${growth}" 
                        id="growth-input"
                        on-input="handleGrowth"
                    />
                </div>
            </div>
        `;
    }
}
defineComponent("settings-panel", SettingsPanel);
