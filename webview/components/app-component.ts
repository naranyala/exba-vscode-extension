import { ExbaComponent, css, defineComponent, html, memo, signal } from "../core/exba";
import { callWasm, debounce, formatCurrency, formatNumber, passStringToWasm } from "../core/utils";
import { vscode } from "../core/vscode-service";

// 1. Create reactive signals shared by all components
const [getUsers, setUsers] = signal(25000);

const [getConversion, setConversion] = signal(3.5);
const [getSpend, setSpend] = signal(55);
const [getGrowth, setGrowth] = signal(18);
const [getTab, setTab] = signal<"dashboard" | "explorer">("explorer");
const [getSearch, setSearch] = signal("");

// 2. Define Memos (Derived State)
const getMetrics = memo(() => {
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
    const wasm = (ExbaComponent as any).wasm;
    const metrics = getMetrics();
    if (!wasm || !metrics) return [];
    return callWasm(wasm, "generate_chart_data", metrics.monthlyRevenue, getGrowth()) as {
        x: number;
        y: number;
    }[];
});

const getFilteredExtensions = memo(() => {
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
defineComponent("dashboard-app", DashboardApp);
