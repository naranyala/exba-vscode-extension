import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, signal } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        overflow: hidden;
        background: rgba(15, 23, 42, 0.3);
    `,
    tabList: (css: any) => css`
        display: flex;
        background: rgba(30, 41, 59, 0.5);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    `,
    tab: (css: any) => css`
        padding: 0.75rem 1.25rem;
        cursor: pointer;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-family: inherit;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s ease;
        position: relative;
        &:hover {
            color: #e2e8f0;
            background: rgba(255, 255, 255, 0.05);
        }
        &.active {
            color: #818cf8;
            background: rgba(15, 23, 42, 0.5);
        }
        &.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: #818cf8;
        }
    `,
    content: (css: any) => css`
        padding: 1.5rem;
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.6;
        min-height: 120px;
    `
};

export class TabsDemo extends ExbaComponent {
    private _activeTab = signal<number>(0);
    private gCss: any;
    private classes!: {
        container: string;
        tabList: string;
        tab: string;
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
        return ":host { display: block; width: 100%; }";
    }

    private initStyles() {
        this.classes = {
            container: styles.container(this.gCss),
            tabList: styles.tabList(this.gCss),
            tab: styles.tab(this.gCss),
            content: styles.content(this.gCss),
        };
    }

    handleTabClick(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const idx = Number.parseInt(btn.getAttribute("data-index") || "0");
        this._activeTab[1](idx);
    }

    template() {
        const activeTab = this._activeTab[0]();
        const tabs = [
            {
                title: "Overview",
                content: "This is a simple interactive Tabs component. It uses ExbaComponent's reactive signals to track the currently active tab index and instantly swap out the main content view."
            },
            {
                title: "Integration",
                content: "To integrate this component, you simply import the exba-tabs custom element, define the slots or data source, and insert it into the DOM."
            },
            {
                title: "Performance",
                content: "Using shadow DOM and batched DOM updates, EXBA ensures that switching between tabs operates at precisely 60 frames per second without unnecessary repaints."
            }
        ];

        return html`
            <div class="${this.classes.container}">
                <div class="${this.classes.tabList}">
                    ${tabs.map((tab, i) => html`
                        <button 
                            class="${this.classes.tab}${activeTab === i ? " active" : ""}" 
                            on-click="handleTabClick" 
                            data-index="${i}"
                        >
                            ${tab.title}
                        </button>
                    `).join("")}
                </div>
                <div class="${this.classes.content}">
                    ${tabs[activeTab].content}
                </div>
            </div>
        `;
    }
}
defineComponent("exba-tabs", TabsDemo);
