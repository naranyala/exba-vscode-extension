import { css as gooberCss } from "goober";
import {
    ExbaComponent,
    createList,
    createSwitch,
    defineComponent,
    html,
    onAfterRender,
    signal,
} from "../core/exba";
import { vscode } from "../core/vscode-service";
import {
    GRID_ITEMS,
    getActiveTabName,
    getFilteredGridItems,
    getGridSearch,
    getOpenTabs,
    getWasmReady,
    setActiveTabName,
    setGridSearch,
    setOpenTabs,
} from "./state";
import "./geolocation-demo";
import "./notification-demo";
import "./storage-demo";
import "./share-demo";
import "./leaflet-demo";
import "./vis-network-demo";

const styles = {
    header: (css: any) => css`
        margin-bottom: 0.75rem;
        text-align: center;
        & h2 {
            font-size: 1.1rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        & p {
            color: #64748b;
            font-size: 0.65rem;
            margin: 0.15rem 0 0 0;
        }
    `,
    searchBox: (css: any) => css`
        width: 100%;
        box-sizing: border-box;
        padding: 0.55rem 0.85rem;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.5);
        color: #ffffff;
        font-size: 0.8rem;
        outline: none;
        transition: all 0.3s ease;
        font-family: inherit;
        margin-bottom: 0.75rem;
        &:focus {
            border-color: #6366f1;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }
        &::placeholder {
            color: #475569;
        }
    `,
    resultsCount: (css: any) => css`
        font-size: 0.6rem;
        color: #64748b;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
    `,
    sectionHeader: (css: any) => css`
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.5rem 0.25rem;
        cursor: pointer;
        margin-top: 1.25rem;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: transparent;
        border-left: none;
        border-right: none;
        border-top: none;
        width: 100%;
        text-align: left;
        outline: none;
        & h3 {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94a3b8;
            margin: 0;
        }
        & .chevron {
            font-size: 0.6rem;
            color: #64748b;
            transition: transform 0.2s ease;
            display: inline-block;
            &.collapsed {
                transform: rotate(-90deg);
            }
        }
    `,
    grid: (css: any) => css`
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.5rem;
    `,
    card: (css: any) => css`
        background: rgba(30, 41, 59, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 0.6rem 0.75rem;
        display: flex;
        gap: 0.6rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 1px 8px 0 rgba(0, 0, 0, 0.12);
        transition: border-color 0.2s ease, transform 0.2s ease;
        cursor: pointer;
        animation: fadeIn 0.25s ease-out;
        &:hover {
            border-color: rgba(167, 139, 250, 0.3);
            transform: translateY(-1px);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `,
    icon: (css: any) => css`
        font-size: 1.2rem;
        background: rgba(255, 255, 255, 0.03);
        width: 34px;
        height: 34px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `,
    content: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        min-width: 0;
    `,
    contentTop: (css: any) => css`
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
    `,
    category: (css: any) => css`
        font-size: 0.55rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #a78bfa;
        font-weight: 800;
    `,
    score: (css: any) => css`
        font-size: 0.5rem;
        color: #4ade80;
        font-weight: 800;
        white-space: nowrap;
        background: rgba(74, 222, 128, 0.1);
        padding: 0.1rem 0.35rem;
        border-radius: 3px;
    `,
    title: (css: any) => css`
        font-size: 0.8rem;
        font-weight: 700;
        color: #ffffff;
    `,
    desc: (css: any) => css`
        font-size: 0.65rem;
        color: #94a3b8;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
    `,
    tags: (css: any) => css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.2rem;
        margin-top: 0.2rem;
    `,
    tag: (css: any) => css`
        font-size: 0.55rem;
        padding: 0.1rem 0.3rem;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 3px;
        color: #64748b;
    `,
    noResults: (css: any) => css`
        padding: 2rem 0;
        text-align: center;
        color: #64748b;
        font-size: 0.8rem;
    `,
    loading: (css: any) => css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 0;
        color: #94a3b8;
    `,
    spinner: (css: any) => css`
        border: 2px solid rgba(255, 255, 255, 0.05);
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border-left-color: #6366f1;
        animation: spin 1s linear infinite;
        margin-bottom: 0.5rem;
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `,
    navbar: (css: any) => css`
        display: flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        padding: 0.3rem;
        margin-bottom: 0.85rem;
        overflow-x: auto;
        scrollbar-width: none;
        &::-webkit-scrollbar {
            display: none;
        }
    `,
    navItem: (css: any) => css`
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.65rem;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        color: #94a3b8;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        &:hover {
            color: #e2e8f0;
            background: rgba(255, 255, 255, 0.02);
        }
        &.active {
            background: rgba(99, 102, 241, 0.15);
            border-color: rgba(99, 102, 241, 0.2);
            color: #a78bfa;
        }
    `,
    navClose: (css: any) => css`
        display: flex;
        align-items: center;
        justify-content: center;
        width: 13px;
        height: 13px;
        border-radius: 50%;
        font-size: 8px;
        color: #64748b;
        transition: all 0.2s ease;
        margin-left: 0.25rem;
        &:hover {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
    `,
    tabView: (css: any) => css`
        background: rgba(30, 41, 59, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 14px;
        padding: 1rem;
        animation: fadeIn 0.25s ease-out;
    `,
    tabHeader: (css: any) => css`
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.6rem;
    `,
    tabIconLarge: (css: any) => css`
        font-size: 1.8rem;
        background: rgba(255, 255, 255, 0.03);
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    `,
    tabMeta: (css: any) => css`
        display: flex;
        flex-direction: column;
    `,
    tabCategory: (css: any) => css`
        font-size: 0.55rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #a78bfa;
        font-weight: 800;
    `,
    tabTitle: (css: any) => css`
        font-size: 1rem;
        font-weight: 800;
        margin: 0;
        color: #ffffff;
    `,
    tabDesc: (css: any) => css`
        font-size: 0.75rem;
        color: #cbd5e1;
        line-height: 1.4;
        margin: 0.4rem 0 0.6rem 0;
    `,
    tabTags: (css: any) => css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        margin-bottom: 1rem;
    `,
    interactivePanel: (css: any) => css`
        background: rgba(15, 23, 42, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        padding: 0.85rem;
        & h4 {
            margin: 0 0 0.2rem 0;
            font-size: 0.75rem;
            font-weight: 700;
            color: #e2e8f0;
        }
        & p {
            margin: 0 0 0.6rem 0;
            font-size: 0.65rem;
            color: #64748b;
        }
    `,
};

export class GridMenuApp extends ExbaComponent {
    private _sectionsExpanded = signal<Record<string, boolean>>({
        components: false,
        apis: false,
        vscodeApi: true,
    });

    private gCss: any;
    private classes!: {
        header: string;
        searchBox: string;
        resultsCount: string;
        sectionHeader: string;
        grid: string;
        card: string;
        icon: string;
        content: string;
        contentTop: string;
        category: string;
        score: string;
        title: string;
        desc: string;
        tags: string;
        tag: string;
        noResults: string;
        loading: string;
        spinner: string;
        navbar: string;
        navItem: string;
        navClose: string;
        tabView: string;
        tabHeader: string;
        tabIconLarge: string;
        tabMeta: string;
        tabCategory: string;
        tabTitle: string;
        tabDesc: string;
        tabTags: string;
        interactivePanel: string;
    };

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
        this.initStyles();
    }

    connectedCallback() {
        super.connectedCallback();

        onAfterRender(() => {
            const area = this.shadow.querySelector("[data-demo-area]");
            if (!area) return;

            const demoComponents: Record<string, () => HTMLElement> = {
                "Accordion Component": () => {
                    const el = document.createElement("exba-accordion");
                    return el;
                },
                "TreeView Component": () => {
                    const el = document.createElement("exba-tree-view");
                    return el;
                },
                "Kanban Board": () => {
                    const el = document.createElement("exba-kanban");
                    return el;
                },
                "Calendar Date Picker": () => {
                    const el = document.createElement("exba-calendar");
                    return el;
                },
                "Geolocation API": () => document.createElement("exba-geolocation-demo"),
                "Notification API": () => document.createElement("exba-notification-demo"),
                "Local Storage API": () => document.createElement("exba-storage-demo"),
                "Web Share API": () => document.createElement("exba-share-demo"),
                "Leaflet Demo": () => document.createElement("exba-leaflet-demo"),
                "Vis Network Demo": () => document.createElement("exba-vis-network-demo"),
                "Audio Player": () => document.createElement("audio-player"),
                "WASM Text Format": () => document.createElement("exba-format-demo"),
            };

            createSwitch(
                () => getActiveTabName(),
                demoComponents,
                () => area as HTMLElement,
            );
        });
    }

    styles() {
        return `
            :host {
                display: block;
                font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
                color: #e2e8f0;
                background: transparent;
                padding: 0.75rem;
                height: 100%;
                box-sizing: border-box;
                overflow-y: auto;
                overflow-x: hidden;
            }
        `;
    }

    private initStyles() {
        this.classes = {
            header: styles.header(this.gCss),
            searchBox: styles.searchBox(this.gCss),
            resultsCount: styles.resultsCount(this.gCss),
            sectionHeader: styles.sectionHeader(this.gCss),
            grid: styles.grid(this.gCss),
            card: styles.card(this.gCss),
            icon: styles.icon(this.gCss),
            content: styles.content(this.gCss),
            contentTop: styles.contentTop(this.gCss),
            category: styles.category(this.gCss),
            score: styles.score(this.gCss),
            title: styles.title(this.gCss),
            desc: styles.desc(this.gCss),
            tags: styles.tags(this.gCss),
            tag: styles.tag(this.gCss),
            noResults: styles.noResults(this.gCss),
            loading: styles.loading(this.gCss),
            spinner: styles.spinner(this.gCss),
            navbar: styles.navbar(this.gCss),
            navItem: styles.navItem(this.gCss),
            navClose: styles.navClose(this.gCss),
            tabView: styles.tabView(this.gCss),
            tabHeader: styles.tabHeader(this.gCss),
            tabIconLarge: styles.tabIconLarge(this.gCss),
            tabMeta: styles.tabMeta(this.gCss),
            tabCategory: styles.tabCategory(this.gCss),
            tabTitle: styles.tabTitle(this.gCss),
            tabDesc: styles.tabDesc(this.gCss),
            tabTags: styles.tabTags(this.gCss),
            interactivePanel: styles.interactivePanel(this.gCss),
        };
    }

    handleGridSearch(e: Event) {
        setGridSearch((e.target as HTMLInputElement).value);
    }

    handleGridClick(e: Event) {
        const card = e.currentTarget as HTMLElement;
        const name = card.getAttribute("data-name");
        if (name) {
            vscode.postMessage("extensionAction", { name });
            const item = GRID_ITEMS.find((x) => x.name === name);
            if (item) {
                const openTabs = getOpenTabs();
                if (!openTabs.some((x) => x.name === name)) {
                    setOpenTabs([...openTabs, item]);
                }
                setActiveTabName(name);
            }
        }
    }

    handleTabClick(e: Event) {
        const target = e.currentTarget as HTMLElement;
        const name = target.getAttribute("data-name");
        if (name) {
            setActiveTabName(name);
        }
    }

    handleCloseTab(e: Event) {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const name = target.getAttribute("data-name");
        if (name) {
            const openTabs = getOpenTabs();
            const filtered = openTabs.filter((x) => x.name !== name);
            setOpenTabs(filtered);

            if (getActiveTabName() === name) {
                if (filtered.length > 0) {
                    setActiveTabName(filtered[filtered.length - 1].name);
                } else {
                    setActiveTabName("home");
                }
            }
        }
    }

    handleHomeClick() {
        setActiveTabName("home");
    }

    handleToggleComponents() {
        const [get, set] = this._sectionsExpanded;
        set({ ...get(), components: !get().components });
    }

    handleToggleVscodeApi() {
        const [get, set] = this._sectionsExpanded;
        set({ ...get(), vscodeApi: !get().vscodeApi });
    }

    handleToggleApis() {
        const [get, set] = this._sectionsExpanded;
        set({ ...get(), apis: !get().apis });
    }

    private renderCard(item: any, query: string): string {
        return html`
            <div class="card ${this.classes.card}" on-click="handleGridClick" data-name="${item.name}">
                <div class="${this.classes.icon}">${item.icon}</div>
                <div class="${this.classes.content}">
                    <div class="${this.classes.contentTop}">
                        <span class="${this.classes.category}">${item.category}</span>
                        ${query ? html`<span class="${this.classes.score}">${item.score}%</span>` : ""}
                    </div>
                    <span class="${this.classes.title}">${item.name}</span>
                    <span class="${this.classes.desc}">${item.description}</span>
                    <div class="${this.classes.tags}">
                        ${item.tags.map((tag: string) => html`<span class="${this.classes.tag}">#${tag}</span>`).join("")}
                    </div>
                </div>
            </div>
        `;
    }

    template() {
        if (!this.classes) return html`<div>Loading...</div>`;
        if (!getWasmReady()) {
            return html`
                <div class="${this.classes.loading}">
                    <div class="${this.classes.spinner}"></div>
                    <p>Loading WASM engine...</p>
                </div>
            `;
        }

        const search = getGridSearch();
        const items = getFilteredGridItems() || [];
        const query = search.toLowerCase().trim();
        const activeTab = getActiveTabName();
        const openTabs = getOpenTabs();
        const sectionsExpanded = this._sectionsExpanded[0]();

        // Find current active item if not in home view
        const activeItem = openTabs.find((x) => x.name === activeTab);

        const componentItems = items.filter((x) => x.category === "Component Examples");
        const apiItems = items.filter((x) => x.category === "Browser API");
        const vscodeApiItems = items.filter((x) => x.category === "vscode api exploration");

        return html`
            <div class="${this.classes.navbar}">
                <button class="${this.classes.navItem}${activeTab === "home" ? " active" : ""}" on-click="handleHomeClick">
                    <span>🏠</span>
                    <span>Home</span>
                </button>
                ${openTabs
                    .map(
                        (tab) => html`
                    <button 
                        class="${this.classes.navItem}${activeTab === tab.name ? " active" : ""}" 
                        on-click="handleTabClick" 
                        data-name="${tab.name}"
                    >
                        <span>${tab.icon}</span>
                        <span>${tab.name}</span>
                        <span class="${this.classes.navClose}" on-click="handleCloseTab" data-name="${tab.name}">✕</span>
                    </button>
                `,
                    )
                    .join("")}
            </div>

            ${
                activeTab === "home"
                    ? html`
                <div class="${this.classes.header}">
                    <h2>EXBA Component Explorer</h2>
                    <p>Fuzzy search and review framework components</p>
                </div>

                <input 
                    type="text" 
                    class="${this.classes.searchBox}" 
                    placeholder="Search components..." 
                    value="${search}" 
                    id="grid-search"
                    on-input="handleGridSearch"
                    autofocus
                />

                <div class="${this.classes.resultsCount}">
                    ${query ? `${items.length} result${items.length !== 1 ? "s" : ""} for "${search}"` : `${items.length} components`}
                </div>

                <!-- VS Code API Exploration Collapsible Lane -->
                <button class="${this.classes.sectionHeader}" on-click="handleToggleVscodeApi">
                    <h3>VS Code API Exploration</h3>
                    <span class="chevron${!sectionsExpanded.vscodeApi ? " collapsed" : ""}">▼</span>
                </button>
                ${
                    sectionsExpanded.vscodeApi
                        ? vscodeApiItems.length > 0
                            ? html`
                        <div class="${this.classes.grid}">
                            ${vscodeApiItems.map((item) => this.renderCard(item, query)).join("")}
                        </div>
                    `
                            : html`
                        <div class="${this.classes.noResults}">
                            <p>No API exploration demos match "${search}"</p>
                        </div>
                    `
                        : ""
                }

                <!-- Component Examples Collapsible Lane -->
                <button class="${this.classes.sectionHeader}" on-click="handleToggleComponents">
                    <h3>Component Examples</h3>
                    <span class="chevron${!sectionsExpanded.components ? " collapsed" : ""}">▼</span>
                </button>
                ${
                    sectionsExpanded.components
                        ? componentItems.length > 0
                            ? html`
                        <div class="${this.classes.grid}">
                            ${componentItems.map((item) => this.renderCard(item, query)).join("")}
                        </div>
                    `
                            : html`
                        <div class="${this.classes.noResults}">
                            <p>No component examples match "${search}"</p>
                        </div>
                    `
                        : ""
                }

                <!-- Browser API Collapsible Lane -->
                <button class="${this.classes.sectionHeader}" on-click="handleToggleApis">
                    <h3>Browser API</h3>
                    <span class="chevron${!sectionsExpanded.apis ? " collapsed" : ""}">▼</span>
                </button>
                ${
                    sectionsExpanded.apis
                        ? apiItems.length > 0
                            ? html`
                        <div class="${this.classes.grid}">
                            ${apiItems.map((item) => this.renderCard(item, query)).join("")}
                        </div>
                    `
                            : html`
                        <div class="${this.classes.noResults}">
                            <p>No browser APIs match "${search}"</p>
                        </div>
                    `
                        : ""
                }
            `
                    : activeItem
                      ? html`
                <div class="${this.classes.tabView}">
                    <div class="${this.classes.tabHeader}">
                        <span class="${this.classes.tabIconLarge}">${activeItem.icon}</span>
                        <div class="${this.classes.tabMeta}">
                            <span class="${this.classes.tabCategory}">${activeItem.category}</span>
                            <h3 class="${this.classes.tabTitle}">${activeItem.name}</h3>
                        </div>
                    </div>
                    <p class="${this.classes.tabDesc}">${activeItem.description}</p>
                    
                    <div class="${this.classes.tabTags}">
                        ${activeItem.tags.map((tag) => html`<span class="${this.classes.tag}">#${tag}</span>`).join("")}
                    </div>

                    <div class="${this.classes.interactivePanel}">
                        <h4>Live Demo</h4>
                        <p>Interact with the API or component below:</p>
                        <div data-demo-area></div>
                    </div>
                </div>
              `
                      : ""
            }
        `;
    }
}
defineComponent("grid-menu-app", GridMenuApp);
