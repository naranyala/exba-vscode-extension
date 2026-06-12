import { ExbaComponent, defineComponent, signal, html } from "../core/exba";
import { css } from "goober";

const gooberCss = css;

const styles = {
    container: (css: any) => css`
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        height: 100%;
        color: #e2e8f0;
    `,
    pane: (css: any) => css`
        background: rgba(15, 23, 42, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
    `,
    header: (css: any) => css`
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `,
    textarea: (css: any) => css`
        flex: 1;
        background: #0f172a;
        color: #a5b4fc;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        padding: 0.5rem;
        font-family: 'Fira Code', monospace;
        font-size: 0.85rem;
        resize: none;
        outline: none;
        white-space: pre;
        &:focus {
            border-color: #6366f1;
        }
    `,
    tabList: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
        flex: 1;
    `,
    tabItem: (css: any) => css`
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        gap: 0.75rem;
        transition: all 0.2s;
        &:hover {
            background: rgba(255, 255, 255, 0.1);
        }
    `,
    tabIcon: (css: any) => css`
        font-size: 1.2rem;
    `,
    tabInfo: (css: any) => css`
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `,
    tabTitle: (css: any) => css`
        font-size: 0.9rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    `,
    tabUrl: (css: any) => css`
        font-size: 0.7rem;
        color: #94a3b8;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    `,
    button: (css: any) => css`
        background: #4f46e5;
        color: white;
        border: none;
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        transition: background 0.2s;
        &:hover { background: #6366f1; }
    `,
    deleteBtn: (css: any) => css`
        background: transparent;
        color: #ef4444;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0.2rem;
        opacity: 0.6;
        &:hover { opacity: 1; }
    `,
    errorMsg: (css: any) => css`
        color: #ef4444;
        font-size: 0.8rem;
        margin-top: 0.5rem;
    `
};

interface BrowserTab {
    id: string;
    title: string;
    url: string;
    icon: string;
}

const DEFAULT_TABS: BrowserTab[] = [
    { id: "1", title: "GitHub - EXBA Framework", url: "https://github.com/exba", icon: "🐙" },
    { id: "2", title: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "🌐" },
    { id: "3", title: "VS Code API Reference", url: "https://code.visualstudio.com/api", icon: "📘" }
];

export class BrowserTabsDemo extends ExbaComponent {
    private gCss: any;
    private classes: Record<string, string>;
    
    private _tabs = signal<BrowserTab[]>(DEFAULT_TABS);
    private _jsonString = signal<string>(JSON.stringify(DEFAULT_TABS, null, 4));
    private _error = signal<string>("");

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
        this.classes = {
            container: styles.container(this.gCss),
            pane: styles.pane(this.gCss),
            header: styles.header(this.gCss),
            textarea: styles.textarea(this.gCss),
            tabList: styles.tabList(this.gCss),
            tabItem: styles.tabItem(this.gCss),
            tabIcon: styles.tabIcon(this.gCss),
            tabInfo: styles.tabInfo(this.gCss),
            tabTitle: styles.tabTitle(this.gCss),
            tabUrl: styles.tabUrl(this.gCss),
            button: styles.button(this.gCss),
            deleteBtn: styles.deleteBtn(this.gCss),
            errorMsg: styles.errorMsg(this.gCss)
        };
    }

    handleJsonChange = (e: Event) => {
        const val = (e.target as HTMLTextAreaElement).value;
        this._jsonString[1](val);
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                this._tabs[1](parsed);
                this._error[1]("");
            } else {
                this._error[1]("Root must be an array");
            }
        } catch (err: any) {
            this._error[1]("Invalid JSON: " + err.message);
        }
    };

    handleAddTab = () => {
        const current = this._tabs[0]();
        const newTab = {
            id: Date.now().toString(),
            title: "New Tab",
            url: "https://example.com",
            icon: "📄"
        };
        const updated = [...current, newTab];
        this._tabs[1](updated);
        this._jsonString[1](JSON.stringify(updated, null, 4));
        this._error[1]("");
    };

    handleDeleteTab = (id: string) => {
        const current = this._tabs[0]();
        const updated = current.filter(t => t.id !== id);
        this._tabs[1](updated);
        this._jsonString[1](JSON.stringify(updated, null, 4));
        this._error[1]("");
    };

    template() {
        const tabs = this._tabs[0]();
        const jsonStr = this._jsonString[0]();
        const error = this._error[0]();

        return html`
            <div class="${this.classes.container}">
                <div class="${this.classes.pane}">
                    <div class="${this.classes.header}">
                        <span>Visual Manager</span>
                        <button class="${this.classes.button}" on-click="${this.handleAddTab}">+ Add Tab</button>
                    </div>
                    <div class="${this.classes.tabList}">
                        ${tabs.map(tab => html`
                            <div class="${this.classes.tabItem}">
                                <div class="${this.classes.tabIcon}">${tab.icon || "📄"}</div>
                                <div class="${this.classes.tabInfo}">
                                    <span class="${this.classes.tabTitle}">${tab.title}</span>
                                    <span class="${this.classes.tabUrl}">${tab.url}</span>
                                </div>
                                <button class="${this.classes.deleteBtn}" on-click="${() => this.handleDeleteTab(tab.id)}">✕</button>
                            </div>
                        `).join("")}
                    </div>
                </div>
                <div class="${this.classes.pane}">
                    <div class="${this.classes.header}">
                        <span>JSON Source</span>
                    </div>
                    <textarea 
                        class="${this.classes.textarea}" 
                        .value="${jsonStr}"
                        on-input="${this.handleJsonChange}"
                        spellcheck="false"
                    ></textarea>
                    ${error ? html`<div class="${this.classes.errorMsg}">${error}</div>` : ""}
                </div>
            </div>
        `;
    }
}

defineComponent("exba-browser-tabs", BrowserTabsDemo);
