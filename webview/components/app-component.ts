import "../index.css";
import { ExbaComponent, css, defineComponent, html, memo, signal } from "../core/exba";
import { callWasm, debounce, formatCurrency, formatNumber, passStringToWasm } from "../core/utils";
import { vscode } from "../core/vscode-service";

// Export ExbaComponent as WasmComponent for webview HTML to import
export const WasmComponent = ExbaComponent;

// 1. Create reactive signals shared by all components
const [getUsers, setUsers] = signal(25000);

const [getConversion, setConversion] = signal(3.5);
const [getSpend, setSpend] = signal(55);
const [getGrowth, setGrowth] = signal(18);
const [getTab, setTab] = signal<"dashboard" | "explorer">("explorer");
const [getSearch, setSearch] = signal("");

// 1b. WASM readiness signal (memos depend on this to re-evaluate after WASM loads)
const [getWasmReady, setWasmReady] = signal(false);

// 1c. Grid menu signals (isolated for sidepanel)
const [getGridSearch, setGridSearch] = signal("");

interface TabItem {
    name: string;
    icon: string;
    category: string;
    description: string;
    tags: string[];
}
const [getOpenTabs, setOpenTabs] = signal<TabItem[]>([]);
const [getActiveTabName, setActiveTabName] = signal<string>("home");

interface ExtensionItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
}

const EXTENSIONS: ExtensionItem[] = [
    {
        name: "Rust Analyzer",
        description: "Advanced compiler support, linting, and diagnostics for Rust.",
        category: "Languages",
        icon: "🦀",
        tags: ["rust", "analyzer", "compiler"],
    },
    {
        name: "GitLens",
        description: "Supercharge Git inside VS Code with inline blame annotations.",
        category: "Version Control",
        icon: "🌀",
        tags: ["git", "history", "blame"],
    },
    {
        name: "Prettier",
        description: "Opinionated code formatter supporting TS, JS, CSS, and HTML.",
        category: "Formatting",
        icon: "✨",
        tags: ["format", "prettier", "code-style"],
    },
    {
        name: "Docker UI",
        description: "Manage containers, build images, and inspect networks from a sidebar.",
        category: "Containers",
        icon: "🐳",
        tags: ["docker", "containers", "devops"],
    },
    {
        name: "Database Explorer",
        description: "Connect to PostgreSQL, MySQL, and SQLite databases directly.",
        category: "Database",
        icon: "🗄️",
        tags: ["sql", "postgres", "database", "sqlite"],
    },
    {
        name: "Theme Designer",
        description: "Live preview and compile custom editor color palettes.",
        category: "Aesthetics",
        icon: "🎨",
        tags: ["theme", "styles", "colors", "css"],
    },
];

// Grid Menu items for EXBA sidepanel
interface GridItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
    action: string;
}

const GRID_ITEMS: GridItem[] = [
    {
        name: "WASM Engine",
        description: "Native Rust-WASM calculation engine for high-performance metrics.",
        category: "Core",
        icon: "🚀",
        tags: ["wasm", "rust", "engine", "native"],
        action: "extensionAction",
    },
    {
        name: "Fuzzy Search",
        description: "Real-time fuzzy matching powered by WebAssembly in Rust.",
        category: "Search",
        icon: "🔍",
        tags: ["fuzzy", "search", "wasm", "rust"],
        action: "extensionAction",
    },
    {
        name: "Signal Framework",
        description: "Reactive signals, memos, and effects for state management.",
        category: "Framework",
        icon: "⚡",
        tags: ["reactive", "signals", "state", "framework"],
        action: "extensionAction",
    },
    {
        name: "Component Library",
        description: "Custom web components with declarative templates and shadow DOM.",
        category: "UI",
        icon: "🧩",
        tags: ["components", "web", "shadow-dom", "custom-elements"],
        action: "extensionAction",
    },
    {
        name: "Webview Bridge",
        description: "VS Code extension communication via typed postMessage API.",
        category: "Core",
        icon: "🔗",
        tags: ["vscode", "bridge", "messaging", "api"],
        action: "extensionAction",
    },
    {
        name: "Chart Generator",
        description: "SVG revenue chart rendered from Rust-calculated projections.",
        category: "Visualization",
        icon: "📊",
        tags: ["chart", "svg", "visualization", "rust"],
        action: "extensionAction",
    },
    {
        name: "Revenue Metrics",
        description: "Business KPIs computed in native WASM with zero overhead.",
        category: "Analytics",
        icon: "💰",
        tags: ["metrics", "revenue", "analytics", "kpi"],
        action: "extensionAction",
    },
    {
        name: "Tree Explorer",
        description: "Workspace dependency tree view with refreshable data.",
        category: "Explorer",
        icon: "🌳",
        tags: ["tree", "dependencies", "workspace", "explorer"],
        action: "extensionAction",
    },
    {
        name: "Dashboard Panel",
        description: "Full analytics dashboard with configurable growth projections.",
        category: "Analytics",
        icon: "📈",
        tags: ["dashboard", "analytics", "projections", "growth"],
        action: "extensionAction",
    },
    {
        name: "Rust WASM Bridge",
        description: "Memory-safe string passing and function calls between JS and Rust.",
        category: "Core",
        icon: "🦀",
        tags: ["rust", "wasm", "bridge", "memory"],
        action: "extensionAction",
    },
];

// 2. Define Memos (Derived State)
const getMetrics = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    if (!wasm) return null;
    return callWasm(
        wasm,
        "calculate_metrics",
        getUsers(),
        getConversion(),
        getSpend(),
        getGrowth(),
    );
});

const getChartData = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const metrics = getMetrics();
    if (!wasm || !metrics) return [];
    return callWasm(wasm, "generate_chart_data", metrics.monthlyRevenue, getGrowth()) as {
        x: number;
        y: number;
    }[];
});

const getFilteredExtensions = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const search = getSearch().toLowerCase().trim();
    if (!wasm) return [];

    return EXTENSIONS.map((ext) => {
        if (!search) return { ...ext, score: 100 };

        const [qPtr, qLen] = passStringToWasm(wasm, search);
        const targetText = `${ext.name} ${ext.description} ${ext.category} ${ext.tags.join(" ")}`;
        const [tPtr, tLen] = passStringToWasm(wasm, targetText);

        const score = wasm.score_search(qPtr, qLen, tPtr, tLen);
        wasm.dealloc(qPtr, qLen);
        wasm.dealloc(tPtr, tLen);

        return { ...ext, score };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
});

const getFilteredGridItems = memo(() => {
    getWasmReady();
    const wasm = (ExbaComponent as any).wasm;
    const search = getGridSearch().toLowerCase().trim();
    if (!wasm) return [];

    return GRID_ITEMS.map((item) => {
        if (!search) return { ...item, score: 100 };

        const [qPtr, qLen] = passStringToWasm(wasm, search);
        const targetText = `${item.name} ${item.description} ${item.category} ${item.tags.join(" ")}`;
        const [tPtr, tLen] = passStringToWasm(wasm, targetText);

        const score = wasm.score_search(qPtr, qLen, tPtr, tLen);
        wasm.dealloc(qPtr, qLen);
        wasm.dealloc(tPtr, tLen);

        return { ...item, score };
    })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
});

// 3. Define the SettingsPanel component
export class SettingsPanel extends ExbaComponent {
    handleGrowth(e: Event) {
        setGrowth(Number.parseInt((e.target as HTMLInputElement).value));
    }

    styles() {
        return css`
            :host {
                display: block;
                background: rgba(15, 23, 42, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.04);
                border-radius: 16px;
                padding: 1.25rem;
            }
            .title {
                font-size: 0.8rem;
                font-weight: 800;
                color: #94a3b8;
                margin-bottom: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .row {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            .row-header {
                display: flex;
                justify-content: space-between;
                font-size: 0.85rem;
            }
            .label {
                color: #cbd5e1;
            }
            .value {
                color: #a78bfa;
                font-family: monospace;
                font-weight: 700;
            }
            input[type="range"] {
                -webkit-appearance: none;
                width: 100%;
                height: 4px;
                border-radius: 999px;
                background: #334155;
                outline: none;
            }
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: #a78bfa;
                cursor: pointer;
            }
        `;
    }

    template() {
        const growth = getGrowth();
        return html`
            <div>
                <div class="title">Config Engine</div>
                <div class="row">
                    <div class="row-header">
                        <span class="label">Target Growth</span>
                        <span class="value">+${growth}%</span>
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

// 4. Define the WasmChart component
export class WasmChart extends ExbaComponent {
    styles() {
        return css`
            :host {
                display: block;
                background: rgba(30, 41, 59, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 20px;
                padding: 1.5rem;
                margin-top: 1.5rem;
                overflow: hidden;
            }
            .chart-title {
                font-size: 0.85rem;
                font-weight: 700;
                color: #94a3b8;
                margin-bottom: 1rem;
                display: flex;
                justify-content: space-between;
            }
            .chart-container {
                width: 100%;
                height: 180px;
            }
            polyline {
                fill: none;
                stroke: #a78bfa;
                stroke-width: 3;
                stroke-linecap: round;
                stroke-linejoin: round;
                filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.4));
            }
            .grid-line {
                stroke: rgba(255, 255, 255, 0.05);
                stroke-width: 1;
            }
            .axis-label {
                fill: #64748b;
                font-size: 10px;
                font-family: monospace;
            }
        `;
    }

    template() {
        const data = getChartData();
        const growth = getGrowth();
        if (data.length === 0) return "";

        const width = 600;
        const height = 180;
        const padding = 20;

        const maxY = Math.max(...data.map((d) => d.y));
        const minY = Math.min(...data.map((d) => d.y));
        const rangeY = maxY - minY || 1;

        const points = data
            .map((d) => {
                const x = padding + (d.x / 11) * (width - 2 * padding);
                const y = height - padding - ((d.y - minY) / rangeY) * (height - 2 * padding);
                return `${x},${y}`;
            })
            .join(" ");

        return html`
            <div>
                <div class="chart-title">
                    <span>12-Month Revenue Forecast</span>
                    <span style="color: #4ade80">+${growth}% YoY</span>
                </div>
                <div class="chart-container">
                    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                        <line class="grid-line" x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" />
                        <line class="grid-line" x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" />
                        <line class="grid-line" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" />
                        <text class="axis-label" x="${padding}" y="${height - 5}">Month 0</text>
                        <text class="axis-label" x="${width - padding - 45}" y="${height - 5}">Month 12</text>
                        <polyline points="${points}" />
                    </svg>
                </div>
            </div>
        `;
    }
}
defineComponent("wasm-chart", WasmChart);

// 5. Define the main DashboardApp component
export class DashboardApp extends ExbaComponent {
    styles() {
        return css`
            :host {
                display: block;
                font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
                color: #e2e8f0;
                background: transparent;
            }

            .container {
                max-width: 1000px;
                margin: 0 auto;
                padding: 2rem;
            }

            header {
                margin-bottom: 2.5rem;
                text-align: center;
            }

            h1 {
                font-size: 2.5rem;
                font-weight: 800;
                margin: 0;
                background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            header p {
                color: #94a3b8;
                margin-top: 0.5rem;
                font-size: 1.1rem;
            }

            .nav-tabs {
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
            }

            .nav-btn {
                flex: 1;
                padding: 0.6rem 1.2rem;
                border: none;
                background: transparent;
                color: #94a3b8;
                border-radius: 999px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .nav-btn:hover {
                color: #e2e8f0;
            }

            .nav-btn.active {
                background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
                color: #ffffff;
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            }

            .grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 2rem;
            }

            @media (min-width: 768px) {
                .grid {
                    grid-template-columns: 350px 1fr;
                }
            }

            .card-controls {
                background: rgba(30, 41, 59, 0.4);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 24px;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                gap: 1.75rem;
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
            }

            .control-group {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .control-header {
                display: flex;
                justify-content: space-between;
                font-size: 0.9rem;
                font-weight: 600;
            }

            .label {
                color: #cbd5e1;
            }

            .value {
                color: #a78bfa;
                font-family: monospace;
                font-size: 1rem;
            }

            input[type="range"] {
                -webkit-appearance: none;
                width: 100%;
                height: 6px;
                border-radius: 999px;
                background: #334155;
                outline: none;
            }

            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
                cursor: pointer;
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
                transition: transform 0.1s ease;
            }

            input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
            }

            .stats-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }

            @media (min-width: 600px) {
                .stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            .stat-card {
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
            }

            .stat-card:hover {
                border-color: rgba(99, 102, 241, 0.25);
                transform: translateY(-2px);
            }

            .stat-title {
                color: #94a3b8;
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 700;
            }

            .stat-value {
                font-size: 2.25rem;
                font-weight: 800;
                margin: 0.75rem 0 0.25rem 0;
                background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .stat-highlight {
                background: linear-gradient(135deg, #a78bfa 0%, #818cf8 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .stat-desc {
                color: #64748b;
                font-size: 0.8rem;
            }

            .badge {
                display: inline-block;
                padding: 0.25rem 0.6rem;
                border-radius: 999px;
                font-size: 0.75rem;
                font-weight: 700;
                background: rgba(167, 139, 250, 0.1);
                color: #a78bfa;
                margin-top: 0.5rem;
                align-self: flex-start;
            }

            .search-container {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                width: 100%;
            }

            .search-box {
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
            }

            .search-box:focus {
                border-color: #6366f1;
                box-shadow: 0 0 16px rgba(99, 102, 241, 0.15);
            }

            .menu-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }

            @media (min-width: 600px) {
                .menu-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }

            .menu-card {
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
            }

            .menu-card:hover {
                border-color: rgba(167, 139, 250, 0.3);
                transform: translateY(-2px);
            }

            .menu-icon {
                font-size: 2rem;
                background: rgba(255, 255, 255, 0.04);
                width: 60px;
                height: 60px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .menu-content {
                display: flex;
                flex-direction: column;
                gap: 0.35rem;
            }

            .menu-category {
                font-size: 0.7rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #a78bfa;
                font-weight: 800;
            }

            .menu-title {
                font-size: 1.1rem;
                font-weight: 700;
                color: #ffffff;
            }

            .menu-desc {
                font-size: 0.85rem;
                color: #94a3b8;
                line-height: 1.4;
            }

            .menu-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.4rem;
                margin-top: 0.5rem;
            }

            .tag {
                font-size: 0.7rem;
                padding: 0.2rem 0.5rem;
                background: rgba(255, 255, 255, 0.04);
                border-radius: 6px;
                color: #64748b;
            }

            .no-results {
                padding: 4rem 0;
                text-align: center;
                color: #64748b;
                font-size: 1.1rem;
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 5rem 0;
                color: #94a3b8;
            }

            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.05);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border-left-color: #6366f1;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
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
                <div class="loading">
                    <div class="spinner"></div>
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
            <div class="container">
                <header>
                    <h1>WASM Dashboard Engine</h1>
                    <p>Reactive browser components calculated via native WebAssembly in Rust</p>
                </header>

                <div class="nav-tabs">
                    <button class="nav-btn ${tab === "dashboard" ? "active" : ""}" id="tab-dashboard" on-click="handleTabDashboard">
                        Analytics
                    </button>
                    <button class="nav-btn ${tab === "explorer" ? "active" : ""}" id="tab-explorer" on-click="handleTabExplorer">
                        Explorer Mockup
                    </button>
                </div>

                ${
                    tab === "dashboard"
                        ? html`
                    <div class="grid">
                        <div class="card-controls">
                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Audience Size</span>
                                    <span class="value">${users.toLocaleString()}</span>
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

                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Conversion Rate</span>
                                    <span class="value">${conversion.toFixed(1)}%</span>
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

                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Average Spend</span>
                                    <span class="value">$${spend}</span>
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

                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-title">Active Customers</span>
                                <span class="stat-value">${formatNumber(metrics.activeCustomers)}</span>
                                <span class="stat-desc">Converting visitors base</span>
                            </div>

                            <div class="stat-card">
                                <span class="stat-title">Monthly Revenue</span>
                                <span class="stat-value stat-highlight">${formatCurrency(metrics.monthlyRevenue)}</span>
                                <span class="stat-desc">Monthly Recurring MRR run-rate</span>
                            </div>

                            <div class="stat-card">
                                <span class="stat-title">Annualized Projection</span>
                                <span class="stat-value">${formatCurrency(metrics.annualProjection)}</span>
                                <span class="badge">Assuming +${growth}% growth</span>
                            </div>

                            <div class="stat-card" style="border-color: rgba(239, 68, 68, 0.05)">
                                <span class="stat-title">Projected Churn</span>
                                <span class="stat-value" style="color: #f87171">${metrics.churnedCustomers} / mo</span>
                                <span class="stat-desc" style="color: #ef4444">Estimated 4% monthly attrition</span>
                            </div>
                        </div>

                        <div style="grid-column: 1 / -1;">
                            <wasm-chart></wasm-chart>
                        </div>
                    </div>
                `
                        : html`
                    <div class="search-container">
                        <input 
                            type="text" 
                            class="search-box" 
                            placeholder="Fuzzy search extensions (e.g. rust, format, docker)..." 
                            value="${search}" 
                            id="search-input"
                            on-input="handleSearch"
                            autofocus
                        />

                        ${
                            filteredExtensions.length > 0
                                ? html`
                            <div class="menu-grid">
                                ${filteredExtensions
                                    .map(
                                        (ext) => html`
                                    <div class="menu-card" on-click="handleExtensionClick" data-name="${ext.name}">
                                        <div class="menu-icon">${ext.icon}</div>
                                        <div class="menu-content">
                                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                                <span class="menu-category">${ext.category}</span>
                                                ${query ? html`<span style="font-size: 0.6rem; color: #4ade80; font-weight: 800;">MATCH: ${ext.score}</span>` : ""}
                                            </div>
                                            <span class="menu-title">${ext.name}</span>
                                            <span class="menu-desc">${ext.description}</span>
                                            <div class="menu-tags">
                                                ${ext.tags.map((tag) => html`<span class="tag">#${tag}</span>`).join("")}
                                            </div>
                                        </div>
                                    </div>
                                `,
                                    )
                                    .join("")}
                            </div>
                        `
                                : html`
                            <div class="no-results">
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

// 6. Define the GridMenuApp component (standalone grid menu for sidepanel)
export class GridMenuApp extends ExbaComponent {
    styles() {
        return css`
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

            .header {
                margin-bottom: 0.75rem;
                text-align: center;
            }

            .header h2 {
                font-size: 1.1rem;
                font-weight: 800;
                margin: 0;
                background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }

            .header p {
                color: #64748b;
                font-size: 0.65rem;
                margin: 0.15rem 0 0 0;
            }

            .search-box {
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
            }

            .search-box:focus {
                border-color: #6366f1;
                box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
            }

            .search-box::placeholder {
                color: #475569;
            }

            .results-count {
                font-size: 0.6rem;
                color: #64748b;
                margin-bottom: 0.5rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                font-weight: 700;
            }

            .grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 0.5rem;
            }

            .card {
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
            }

            .card:hover {
                border-color: rgba(167, 139, 250, 0.3);
                transform: translateY(-1px);
            }

            .icon {
                font-size: 1.2rem;
                background: rgba(255, 255, 255, 0.03);
                width: 34px;
                height: 34px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .content {
                display: flex;
                flex-direction: column;
                gap: 0.15rem;
                min-width: 0;
            }

            .content-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .category {
                font-size: 0.55rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #a78bfa;
                font-weight: 800;
            }

            .score {
                font-size: 0.5rem;
                color: #4ade80;
                font-weight: 800;
                white-space: nowrap;
                background: rgba(74, 222, 128, 0.1);
                padding: 0.1rem 0.35rem;
                border-radius: 3px;
            }

            .title {
                font-size: 0.8rem;
                font-weight: 700;
                color: #ffffff;
            }

            .desc {
                font-size: 0.65rem;
                color: #94a3b8;
                line-height: 1.3;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
            }

            .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.2rem;
                margin-top: 0.2rem;
            }

            .tag {
                font-size: 0.55rem;
                padding: 0.1rem 0.3rem;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 3px;
                color: #64748b;
            }

            .fullscreen-bar {
                margin-top: 1rem;
                display: flex;
                justify-content: center;
            }

            .fullscreen-btn {
                background: rgba(99, 102, 241, 0.15);
                border: 1px solid rgba(99, 102, 241, 0.2);
                color: #a78bfa;
                padding: 0.4rem 1rem;
                border-radius: 8px;
                font-size: 0.7rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                font-family: inherit;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .fullscreen-btn:hover {
                background: rgba(99, 102, 241, 0.25);
                border-color: rgba(99, 102, 241, 0.3);
            }

            .no-results {
                padding: 2rem 0;
                text-align: center;
                color: #64748b;
                font-size: 0.8rem;
            }

            .loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem 0;
                color: #94a3b8;
            }

            .spinner {
                border: 2px solid rgba(255, 255, 255, 0.05);
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border-left-color: #6366f1;
                animation: spin 1s linear infinite;
                margin-bottom: 0.5rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(6px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .navbar {
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
            }
            .navbar::-webkit-scrollbar {
                display: none;
            }
            .nav-item {
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
            }
            .nav-item:hover {
                color: #e2e8f0;
                background: rgba(255, 255, 255, 0.02);
            }
            .nav-item.active {
                background: rgba(99, 102, 241, 0.15);
                border-color: rgba(99, 102, 241, 0.2);
                color: #a78bfa;
            }
            .nav-close {
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
            }
            .nav-close:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }
            .tab-view {
                background: rgba(30, 41, 59, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.04);
                border-radius: 14px;
                padding: 1rem;
                animation: fadeIn 0.25s ease-out;
            }
            .tab-header {
                display: flex;
                align-items: center;
                gap: 0.6rem;
                margin-bottom: 0.6rem;
            }
            .tab-icon-large {
                font-size: 1.8rem;
                background: rgba(255, 255, 255, 0.03);
                width: 42px;
                height: 42px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .tab-meta {
                display: flex;
                flex-direction: column;
            }
            .tab-category {
                font-size: 0.55rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #a78bfa;
                font-weight: 800;
            }
            .tab-title {
                font-size: 1rem;
                font-weight: 800;
                margin: 0;
                color: #ffffff;
            }
            .tab-desc {
                font-size: 0.75rem;
                color: #cbd5e1;
                line-height: 1.4;
                margin: 0.4rem 0 0.6rem 0;
            }
            .tab-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.25rem;
                margin-bottom: 1rem;
            }
            .interactive-panel {
                background: rgba(15, 23, 42, 0.25);
                border: 1px solid rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                padding: 0.85rem;
            }
            .interactive-panel h4 {
                margin: 0 0 0.2rem 0;
                font-size: 0.75rem;
                font-weight: 700;
                color: #e2e8f0;
            }
            .interactive-panel p {
                margin: 0 0 0.6rem 0;
                font-size: 0.65rem;
                color: #64748b;
            }
            .sandbox-demo {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.4rem;
                padding: 0.5rem 0;
                text-align: center;
            }
            .demo-animation {
                font-size: 1.5rem;
                animation: pulse 2s infinite ease-in-out;
            }
            .action-btn {
                background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%);
                border: none;
                color: #ffffff;
                padding: 0.35rem 0.85rem;
                border-radius: 6px;
                font-size: 0.65rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 2px 6px rgba(99, 102, 241, 0.15);
            }
            .action-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 10px rgba(99, 102, 241, 0.25);
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 0.8; }
                50% { transform: scale(1.12); opacity: 1; }
            }
        `;
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

    handleTriggerAction(e: Event) {
        const target = e.currentTarget as HTMLElement;
        const name = target.getAttribute("data-name");
        if (name) {
            vscode.postMessage("extensionAction", { name });
        }
    }

    handleFullscreen() {
        vscode.postMessage("openFullscreen");
    }

    template() {
        const wasm = (ExbaComponent as any).wasm;
        if (!wasm) {
            return html`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading WASM engine...</p>
                </div>
            `;
        }

        const search = getGridSearch();
        const items = getFilteredGridItems();
        const query = search.toLowerCase().trim();
        const activeTab = getActiveTabName();
        const openTabs = getOpenTabs();

        // Find current active item if not in home view
        const activeItem = openTabs.find((x) => x.name === activeTab);

        return html`
            <div class="navbar">
                <button class="nav-item ${activeTab === "home" ? "active" : ""}" on-click="handleHomeClick">
                    <span>🏠</span>
                    <span>Home</span>
                </button>
                ${openTabs
                    .map(
                        (tab) => html`
                    <button 
                        class="nav-item ${activeTab === tab.name ? "active" : ""}" 
                        on-click="handleTabClick" 
                        data-name="${tab.name}"
                    >
                        <span>${tab.icon}</span>
                        <span>${tab.name}</span>
                        <span class="nav-close" on-click="handleCloseTab" data-name="${tab.name}">✕</span>
                    </button>
                `,
                    )
                    .join("")}
            </div>

            ${
                activeTab === "home"
                    ? html`
                <div class="header">
                    <h2>EXBA Grid Menu</h2>
                    <p>Fuzzy search powered by Rust-WASM</p>
                </div>

                <input 
                    type="text" 
                    class="search-box" 
                    placeholder="Search features..." 
                    value="${search}" 
                    id="grid-search"
                    on-input="handleGridSearch"
                    autofocus
                />

                <div class="results-count">
                    ${query ? `${items.length} result${items.length !== 1 ? "s" : ""} for "${search}"` : `${items.length} features`}
                </div>

                ${
                    items.length > 0
                        ? html`
                    <div class="grid">
                        ${items
                            .map(
                                (item) => html`
                            <div class="card" on-click="handleGridClick" data-name="${item.name}">
                                <div class="icon">${item.icon}</div>
                                <div class="content">
                                    <div class="content-top">
                                        <span class="category">${item.category}</span>
                                        ${query ? html`<span class="score">${item.score}%</span>` : ""}
                                    </div>
                                    <span class="title">${item.name}</span>
                                    <span class="desc">${item.description}</span>
                                    <div class="tags">
                                        ${item.tags.map((tag) => html`<span class="tag">#${tag}</span>`).join("")}
                                    </div>
                                </div>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>
                `
                        : html`
                    <div class="no-results">
                        <p>No matches for "${search}"</p>
                    </div>
                `
                }

                <div class="fullscreen-bar">
                    <button class="fullscreen-btn" on-click="handleFullscreen">Open Fullscreen</button>
                </div>
            `
                    : activeItem
                      ? html`
                <div class="tab-view">
                    <div class="tab-header">
                        <span class="tab-icon-large">${activeItem.icon}</span>
                        <div class="tab-meta">
                            <span class="tab-category">${activeItem.category}</span>
                            <h3 class="tab-title">${activeItem.name}</h3>
                        </div>
                    </div>
                    <p class="tab-desc">${activeItem.description}</p>
                    
                    <div class="tab-tags">
                        ${activeItem.tags.map((tag) => html`<span class="tag">#${tag}</span>`).join("")}
                    </div>

                    <div class="interactive-panel">
                        <h4>Feature Sandbox</h4>
                        <p>Interact with the live compiled sub-module below:</p>
                        
                        ${
                            activeItem.name === "WASM Engine" || activeItem.name === "Revenue Metrics"
                                ? html`
                                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                                        <settings-panel></settings-panel>
                                        <wasm-chart></wasm-chart>
                                    </div>
                                `
                                : activeItem.name === "Fuzzy Search"
                                  ? html`
                                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                        <input 
                                            type="text" 
                                            class="search-box" 
                                            placeholder="Type test target text here..." 
                                            id="fuzzy-sim-target"
                                            value="Rust-WASM fuzzy search simulator engine"
                                            style="margin-bottom: 0;"
                                        />
                                        <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: space-between;">
                                            <span style="font-size: 0.7rem; color: #64748b;">Matching against 'wasm'...</span>
                                            <span style="font-family: monospace; font-size: 0.8rem; font-weight: 800; color: #4ade80;">Score: 100%</span>
                                        </div>
                                    </div>
                                `
                                  : html`
                                    <div class="sandbox-demo">
                                        <div class="demo-animation">⚡</div>
                                        <p style="font-size: 0.7rem; color: #64748b; margin: 0.5rem 0;">This feature subpanel communicates directly with VS Code workspace APIs.</p>
                                        <button class="action-btn" on-click="handleTriggerAction" data-name="${activeItem.name}">
                                            Send Message to Host
                                        </button>
                                    </div>
                                `
                        }
                    </div>
                </div>
            `
                      : ""
            }
        `;
    }
}
defineComponent("grid-menu-app", GridMenuApp);
defineComponent("dashboard-app", DashboardApp);

// Auto-initialize: read body data attributes, init WASM, mount component
(async () => {
    const root = document.getElementById("app-root");
    if (!root) return;

    try {
        const wasmUri = document.body.dataset.wasmUri;
        if (wasmUri) {
            await ExbaComponent.initWasm(wasmUri);
            setWasmReady(true);
        }

        const mode = document.body.dataset.mode || "dashboard";
        const tagName = mode === "grid-menu" ? "grid-menu-app" : "dashboard-app";
        const app = document.createElement(tagName);
        root.appendChild(app);
    } catch (err) {
        console.error("Failed to initialize:", err);
        root.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #f87171;">
                <h3>Failed to load</h3>
                <p style="font-size:0.85rem">${err}</p>
            </div>
        `;
    }
})();
