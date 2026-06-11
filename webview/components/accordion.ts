import { ExbaComponent, defineComponent, html, signal } from "../core/exba";
import { css as gooberCss } from "goober";

const styles = {
    item: (css: any) => css`
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        margin-bottom: 0.5rem;
        overflow: hidden;
        background: rgba(15, 23, 42, 0.3);
    `,
    header: (css: any) => css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        cursor: pointer;
        background: rgba(30, 41, 59, 0.3);
        border: none;
        width: 100%;
        text-align: left;
        color: #e2e8f0;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        transition: background 0.2s ease;
        &:hover {
            background: rgba(30, 41, 59, 0.5);
        }
    `,
    chevron: (css: any) => css`
        transition: transform 0.25s ease;
        font-size: 0.7rem;
        color: #64748b;
        &.open {
            transform: rotate(90deg);
        }
    `,
    body: (css: any) => css`
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
        &.open {
            max-height: 500px;
        }
    `,
    content: (css: any) => css`
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        color: #94a3b8;
        line-height: 1.5;
        border-top: 1px solid rgba(255, 255, 255, 0.04);
    `,
};

export class Accordion extends ExbaComponent {
    private _openItems = signal<Set<number>>(new Set());
    private gCss: any;
    private classes!: {
        item: string;
        header: string;
        chevron: string;
        body: string;
        content: string;
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
            item: styles.item(this.gCss),
            header: styles.header(this.gCss),
            chevron: styles.chevron(this.gCss),
            body: styles.body(this.gCss),
            content: styles.content(this.gCss),
        };
    }

    handleToggle(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const idx = Number.parseInt(btn.getAttribute("data-index") || "0");
        const [get, set] = this._openItems;
        const current = new Set(get());
        if (current.has(idx)) {
            current.delete(idx);
        } else {
            current.add(idx);
        }
        set(current);
    }

    template() {
        const openItems = this._openItems[0]();
        const items = [
            {
                title: "Getting Started",
                content:
                    "EXBA is a reactive Web Component framework with WASM integration. Components extend ExbaComponent and use Shadow DOM for style encapsulation.",
            },
            {
                title: "Reactive Signals",
                content:
                    "Signals create [getter, setter] tuples with automatic dependency tracking. Effects re-run when dependencies change, batched via microtask.",
            },
            {
                title: "Memory Management",
                content:
                    "Rust-WASM uses alloc/dealloc for string passing. JS encodes strings to UTF-8, allocates WASM memory, copies bytes, and reads results from a shared buffer.",
            },
        ];

        return html`
            <div>
                ${items
                    .map(
                        (item, i) => html`
                    <div class="${this.classes.item}">
                        <button class="${this.classes.header}" on-click="handleToggle" data-index="${i}">
                            <span>${item.title}</span>
                            <span class="${this.classes.chevron}${openItems.has(i) ? " open" : ""}">▶</span>
                        </button>
                        <div class="${this.classes.body}${openItems.has(i) ? " open" : ""}">
                            <div class="${this.classes.content}">${item.content}</div>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
    }
}
defineComponent("exba-accordion", Accordion);
