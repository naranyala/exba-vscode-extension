import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, onAfterRender } from "../core/exba";
import { debounce, formatCurrency, formatNumber } from "../core/utils";
import { vscode } from "../core/vscode-service";
import "./vega-chart";
import "./audio-player";
import {
    getConversion,
    getFilteredExtensions,
    getGrowth,
    getMetrics,
    getSearch,
    getSpend,
    getTab,
    getUsers,
    setConversion,
    setSearch,
    setSpend,
    setTab,
    setUsers,
} from "./state";

const styles = {
    container: (css: any) => css`
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    `,
    header: (css: any) => css`
        margin-bottom: 2.5rem;
        text-align: center;
        & h1 {
            font-size: 2.5rem;
            font-weight: 800;
            margin: 0;
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        & p {
            color: #94a3b8;
            margin-top: 0.5rem;
            font-size: 1.1rem;
        }
    `,
    navTabs: (css: any) => css`
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 2.5rem;
        background: rgba(30, 41, 59, 0.2);
        padding: 0.4rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    `,
    navBtn: (css: any) => css`
        flex: 1;
        padding: 0.6rem 1.2rem;
        border: none;
        background: transparent;
        color: #94a3b8;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        &:hover {
            color: #e2e8f0;
        }
        &.active {
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
            color: #ffffff;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
    `,
    grid: (css: any) => css`
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
        @media (min-width: 768px) {
            grid-template-columns: 350px 1fr;
        }
    `,
    cardControls: (css: any) => css`
        background: rgba(30, 41, 59, 0.4);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 24px;
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    `,
    controlGroup: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        & input[type="range"] {
            -webkit-appearance: none;
            width: 100%;
            height: 6px;
            border-radius: 999px;
            background: #334155;
            outline: none;
        }
        & input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
            cursor: pointer;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
            transition: transform 0.1s ease;
        }
        & input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.2);
        }
    `,
    controlHeader: (css: any) => css`
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
        font-weight: 600;
    `,
    label: (css: any) => css`
        color: #cbd5e1;
    `,
    value: (css: any) => css`
        color: #a78bfa;
        font-family: monospace;
        font-size: 1rem;
    `,
    statsGrid: (css: any) => css`
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        @media (min-width: 600px) {
            grid-template-columns: repeat(2, 1fr);
        }
    `,
    statCard: (css: any) => css`
        background: rgba(30, 41, 59, 0.25);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.75rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 120px;
        box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
        transition: border-color 0.3s ease, transform 0.3s ease;
        &:hover {
            border-color: rgba(99, 102, 241, 0.25);
            transform: translateY(-2px);
        }
    `,
    statTitle: (css: any) => css`
        color: #94a3b8;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 700;
    `,
    statValue: (css: any) => css`
        font-size: 2.25rem;
        font-weight: 800;
        margin: 0.75rem 0 0.25rem 0;
        background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        &.highlight {
            background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
    `,
    statDesc: (css: any) => css`
        color: #64748b;
        font-size: 0.8rem;
    `,
    badge: (css: any) => css`
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 700;
        background: rgba(167, 139, 250, 0.1);
        color: #a78bfa;
        margin-top: 0.5rem;
        align-self: flex-start;
    `,
    searchContainer: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
    `,
    searchBox: (css: any) => css`
        width: 100%;
        box-sizing: border-box;
        padding: 0.9rem 1.5rem;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(15, 23, 42, 0.4);
        color: #ffffff;
        font-size: 1rem;
        outline: none;
        transition: all 0.3s ease;
        font-family: inherit;
        &:focus {
            border-color: #6366f1;
            box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
        }
    `,
    menuGrid: (css: any) => css`
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
        @media (min-width: 600px) {
            grid-template-columns: repeat(2, 1fr);
        }
    `,
    menuCard: (css: any) => css`
        background: rgba(30, 41, 59, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.5rem;
        display: flex;
        gap: 1.25rem;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
        transition: border-color 0.3s ease, transform 0.3s ease;
        cursor: pointer;
        animation: fadeIn 0.3s ease-out;
        &:hover {
            border-color: rgba(167, 139, 250, 0.3);
            transform: translateY(-2px);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `,
    menuIcon: (css: any) => css`
        font-size: 2rem;
        background: rgba(255, 255, 255, 0.04);
        width: 60px;
        height: 60px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    `,
    menuContent: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    `,
    menuCategory: (css: any) => css`
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #a78bfa;
        font-weight: 800;
    `,
    menuTitle: (css: any) => css`
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
    `,
    menuDesc: (css: any) => css`
        font-size: 0.85rem;
        color: #94a3b8;
        line-height: 1.4;
    `,
    menuTags: (css: any) => css`
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.5rem;
    `,
    tag: (css: any) => css`
        font-size: 0.7rem;
        padding: 0.2rem 0.5rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 6px;
        color: #64748b;
    `,
    noResults: (css: any) => css`
        padding: 4rem 0;
        text-align: center;
        color: #64748b;
        font-size: 1.1rem;
    `,
    loading: (css: any) => css`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 5rem 0;
        color: #94a3b8;
    `,
    spinner: (css: any) => css`
        border: 3px solid rgba(255, 255, 255, 0.05);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border-left-color: #6366f1;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `,
};

export class DashboardApp extends ExbaComponent {
    private gCss: any;
    private classes!: {
        container: string;
        header: string;
        navTabs: string;
        navBtn: string;
        grid: string;
        cardControls: string;
        controlGroup: string;
        controlHeader: string;
        label: string;
        value: string;
        statsGrid: string;
        statCard: string;
        statTitle: string;
        statValue: string;
        statDesc: string;
        badge: string;
        searchContainer: string;
        searchBox: string;
        menuGrid: string;
        menuCard: string;
        menuIcon: string;
        menuContent: string;
        menuCategory: string;
        menuTitle: string;
        menuDesc: string;
        menuTags: string;
        tag: string;
        noResults: string;
        loading: string;
        spinner: string;
    };

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    private demoVegaSpec = {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        description: "A simple bar chart with embedded data.",
        data: {
            values: [
                { a: "A", b: 28 },
                { a: "B", b: 55 },
                { a: "C", b: 43 },
                { a: "D", b: 91 },
                { a: "E", b: 81 },
                { a: "F", b: 53 },
                { a: "G", b: 19 },
                { a: "H", b: 87 },
                { a: "I", b: 52 },
            ],
        },
        mark: "bar",
        encoding: {
            x: { field: "a", type: "nominal", axis: { labelAngle: 0 } },
            y: { field: "b", type: "quantitative" },
        },
    };

    connectedCallback() {
        this.initStyles();
        super.connectedCallback();
        onAfterRender(() => {
            const chart = this.shadow.querySelector("#demo-vega-chart") as any;
            if (chart) chart.spec = this.demoVegaSpec;
        });
    }

    styles() {
        return `
            :host {
                display: block;
                font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
                color: #e2e8f0;
                background: transparent;
            }
        `;
    }

    private initStyles() {
        this.classes = {
            container: styles.container(this.gCss),
            header: styles.header(this.gCss),
            navTabs: styles.navTabs(this.gCss),
            navBtn: styles.navBtn(this.gCss),
            grid: styles.grid(this.gCss),
            cardControls: styles.cardControls(this.gCss),
            controlGroup: styles.controlGroup(this.gCss),
            controlHeader: styles.controlHeader(this.gCss),
            label: styles.label(this.gCss),
            value: styles.value(this.gCss),
            statsGrid: styles.statsGrid(this.gCss),
            statCard: styles.statCard(this.gCss),
            statTitle: styles.statTitle(this.gCss),
            statValue: styles.statValue(this.gCss),
            statDesc: styles.statDesc(this.gCss),
            badge: styles.badge(this.gCss),
            searchContainer: styles.searchContainer(this.gCss),
            searchBox: styles.searchBox(this.gCss),
            menuGrid: styles.menuGrid(this.gCss),
            menuCard: styles.menuCard(this.gCss),
            menuIcon: styles.menuIcon(this.gCss),
            menuContent: styles.menuContent(this.gCss),
            menuCategory: styles.menuCategory(this.gCss),
            menuTitle: styles.menuTitle(this.gCss),
            menuDesc: styles.menuDesc(this.gCss),
            menuTags: styles.menuTags(this.gCss),
            tag: styles.tag(this.gCss),
            noResults: styles.noResults(this.gCss),
            loading: styles.loading(this.gCss),
            spinner: styles.spinner(this.gCss),
        };
    }

    // Action Handlers
    handleUsers(e: Event) {
        setUsers(Number.parseInt((e.target as HTMLInputElement).value));
    }

    handleConversion(e: Event) {
        setConversion(Number.parseFloat((e.target as HTMLInputElement).value));
    }

    handleSpend(e: Event) {
        setSpend(Number.parseInt((e.target as HTMLInputElement).value));
    }

    handleSearch = debounce((e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        setSearch(value);
        if (value) {
            vscode.log(`Searching for: ${value}`);
        }
    }, 200);

    handleTabDashboard() {
        setTab("dashboard");
    }

    handleTabExplorer() {
        setTab("explorer");
    }

    handleExtensionClick(e: Event) {
        const card = e.currentTarget as HTMLElement;
        const name = card.getAttribute("data-name");
        if (name) {
            vscode.postMessage("extensionAction", { name });
        }
    }
    template() {
        const metrics = getMetrics();
        if (!metrics) {
            return html`
            <div class="${this.classes.loading}">
                <div class="${this.classes.spinner}"></div>
                <p>Initializing WASM calculation engine...</p>
            </div>
        `;
        }

        const users = getUsers();
        const conversion = getConversion();
        const spend = getSpend();
        const growth = getGrowth();
        const tab = getTab();
        const search = getSearch();
        const filteredExtensions = getFilteredExtensions();
        const query = search.toLowerCase().trim();

        return html`
        <div class="${this.classes.container}">
                <header class="${this.classes.header}">
                    <h1>WASM Dashboard Engine</h1>
                    <p>Reactive browser components calculated via native WebAssembly in Rust</p>
                </header>

                <div class="${this.classes.navTabs}">
                    <button class="${this.classes.navBtn}${tab === "dashboard" ? " active" : ""}" id="tab-dashboard" on-click="handleTabDashboard">
                        Analytics
                    </button>
                    <button class="${this.classes.navBtn}${tab === "explorer" ? " active" : ""}" id="tab-explorer" on-click="handleTabExplorer">
                        Explorer Mockup
                    </button>
                </div>

                ${
                    tab === "dashboard"
                        ? html`
                    <div class="${this.classes.grid}">
                        <div class="${this.classes.cardControls}">
                            <div class="${this.classes.controlGroup}">
                                <div class="${this.classes.controlHeader}">
                                    <span class="${this.classes.label}">Audience Size</span>
                                    <span class="${this.classes.value}">${users.toLocaleString()}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1000" 
                                    max="100000" 
                                    step="500" 
                                    value="${users}" 
                                    id="users-input"
                                    on-input="handleUsers"
                                />
                            </div>

                            <div class="${this.classes.controlGroup}">
                                <div class="${this.classes.controlHeader}">
                                    <span class="${this.classes.label}">Conversion Rate</span>
                                    <span class="${this.classes.value}">${conversion.toFixed(1)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="20" 
                                    step="0.1" 
                                    value="${conversion}" 
                                    id="conversion-input"
                                    on-input="handleConversion"
                                />
                            </div>

                            <div class="${this.classes.controlGroup}">
                                <div class="${this.classes.controlHeader}">
                                    <span class="${this.classes.label}">Average Spend</span>
                                    <span class="${this.classes.value}">$${spend}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="500" 
                                    step="5" 
                                    value="${spend}" 
                                    id="spend-input"
                                    on-input="handleSpend"
                                />
                            </div>

                            <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 0.5rem 0;" />
                            <settings-panel></settings-panel>
                        </div>

                        <div class="${this.classes.statsGrid}">
                            <div class="${this.classes.statCard}">
                                <span class="${this.classes.statTitle}">Active Customers</span>
                                <span class="${this.classes.statValue}">${formatNumber(metrics.activeCustomers)}</span>
                                <span class="${this.classes.statDesc}">Converting visitors base</span>
                            </div>

                            <div class="${this.classes.statCard}">
                                <span class="${this.classes.statTitle}">Monthly Revenue</span>
                                <span class="${this.classes.statValue} highlight">${formatCurrency(metrics.monthlyRevenue)}</span>
                                <span class="${this.classes.statDesc}">Monthly Recurring MRR run-rate</span>
                            </div>

                            <div class="${this.classes.statCard}">
                                <span class="${this.classes.statTitle}">Annualized Projection</span>
                                <span class="${this.classes.statValue}">${formatCurrency(metrics.annualProjection)}</span>
                                <span class="${this.classes.badge}">Assuming +${growth}% growth</span>
                            </div>

                            <div class="${this.classes.statCard}" style="border-color: rgba(239, 68, 68, 0.05)">
                                <span class="${this.classes.statTitle}">Projected Churn</span>
                                <span class="${this.classes.statValue}" style="color: #f87171">${metrics.churnedCustomers} / mo</span>
                                <span class="${this.classes.statDesc}" style="color: #ef4444">Estimated 4% monthly attrition</span>
                            </div>
                        </div>

                        <div style="grid-column: 1 / -1;">
                            <wasm-chart></wasm-chart>
                            <vega-chart id="demo-vega-chart"></vega-chart>
                            <audio-player src="https://wavesurfer-js.org/example/media/demo.wav"></audio-player>
                        </div>
                    </div>
                `
                        : tab === "explorer"
                          ? html`
                                <div class="${this.classes.container}">
                                    <h2>Explorer Mockup</h2>
                                    <p>This is a placeholder for the Explorer UI.</p>
                                </div>
                            `
                          : html`
                    <div class="${this.classes.searchContainer}">
                        <input 
                            type="text" 
                            class="${this.classes.searchBox}" 
                            placeholder="Fuzzy search extensions (e.g. rust, format, docker)..." 
                            value="${search}" 
                            id="search-input"
                            on-input="handleSearch"
                            autofocus
                        />

                        ${
                            filteredExtensions.length > 0
                                ? html`
                            <div class="${this.classes.menuGrid}">
                                ${filteredExtensions
                                    .map(
                                        (ext) => html`
                                    <div class="${this.classes.menuCard}" on-click="handleExtensionClick" data-name="${ext.name}">
                                        <div class="${this.classes.menuIcon}">${ext.icon}</div>
                                        <div class="${this.classes.menuContent}">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                                <span class="${this.classes.menuCategory}">${ext.category}</span>
                                                ${query ? html`<span style="font-size: 0.6rem; color: #4ade80; font-weight: 800;">MATCH: ${ext.score}</span>` : ""}
                                            </div>
                                            <span class="${this.classes.menuTitle}">${ext.name}</span>
                                            <span class="${this.classes.menuDesc}">${ext.description}</span>
                                            <div class="${this.classes.menuTags}">
                                                ${ext.tags.map((tag) => html`<span class="${this.classes.tag}">#${tag}</span>`).join("")}
                                            </div>
                                        </div>
                                    </div>
                                `,
                                    )
                                    .join("")}
                            </div>
                        `
                                : html`
                            <div class="${this.classes.noResults}">
                                <p>🔍 No extensions matched your search term "${search}"</p>
                            </div>
                        `
                        }
                    </div>
                `
                }
            </div>
        `;
    }
}
defineComponent("dashboard-app", DashboardApp);
