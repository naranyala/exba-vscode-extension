import { WasmComponent, WasmStore } from "./wasm-framework";

interface DashboardState {
    users: number;
    conversion: number;
    spend: number;
    growth: number;
    tab: "dashboard" | "explorer";
    search: string;
}

// 1. Create a reactive global store shared by all components
export const dashboardStore = new WasmStore<DashboardState>({
    users: 25000,
    conversion: 3.5,
    spend: 55,
    growth: 18,
    tab: "explorer",
    search: "",
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

// 2. Define the SettingsPanel component
export class SettingsPanel extends WasmComponent {
    constructor() {
        super();
        this.connectStore(dashboardStore);
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const state = dashboardStore.state;
        this.shadow.innerHTML = `
            <style>
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
            </style>
            <div>
                <div class="title">Config Engine</div>
                <div class="row">
                    <div class="row-header">
                        <span class="label">Target Growth</span>
                        <span class="value">+${state.growth}%</span>
                    </div>
                    <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        step="1"
                        .value="${state.growth}" 
                        id="growth-input"
                    />
                </div>
            </div>
        `;

        this.shadow.getElementById("growth-input")?.addEventListener("input", (e) => {
            state.growth = Number.parseInt((e.target as HTMLInputElement).value);
        });
    }
}
customElements.define("settings-panel", SettingsPanel);

// 3. Define the main DashboardApp component
export class DashboardApp extends WasmComponent {
    constructor() {
        super();
        this.connectStore(dashboardStore);
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const wasm = WasmComponent.wasm;
        if (!wasm) {
            this.shadow.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Initializing WASM calculation engine...</p>
                </div>
            `;
            return;
        }

        const state = dashboardStore.state;

        // Call the Rust WebAssembly engine
        wasm.calculate_metrics(state.users, state.conversion, state.spend, state.growth);
        const metrics = JSON.parse(this.getWasmString());

        // Perform fuzzy search filtering for Explorer view
        const query = state.search.toLowerCase().trim();
        const filteredExtensions = EXTENSIONS.filter((ext) => {
            if (!query) return true;
            return (
                ext.name.toLowerCase().includes(query) ||
                ext.description.toLowerCase().includes(query) ||
                ext.category.toLowerCase().includes(query) ||
                ext.tags.some((tag) => tag.includes(query))
            );
        });

        // Render shadow DOM structure
        this.shadow.innerHTML = `
            <style>
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

                /* Nav Tabs */
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

                /* Controls Card */
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

                /* Output Cards */
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

                /* Explorer View Styles */
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
            </style>
            <div class="container">
                <header>
                    <h1>WASM Dashboard Engine</h1>
                    <p>Reactive browser components calculated via native WebAssembly in Rust</p>
                </header>

                <!-- Navigation Tabs -->
                <div class="nav-tabs">
                    <button class="nav-btn ${state.tab === "dashboard" ? "active" : ""}" id="tab-dashboard">
                        Analytics
                    </button>
                    <button class="nav-btn ${state.tab === "explorer" ? "active" : ""}" id="tab-explorer">
                        Explorer Mockup
                    </button>
                </div>

                <!-- Render Dashboard View -->
                ${
                    state.tab === "dashboard"
                        ? `
                    <div class="grid">
                        <!-- Inputs Card -->
                        <div class="card-controls">
                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Audience Size</span>
                                    <span class="value">${state.users.toLocaleString()}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="1000" 
                                    max="100000" 
                                    step="500" 
                                    .value="${state.users}" 
                                    id="users-input"
                                />
                            </div>

                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Conversion Rate</span>
                                    <span class="value">${state.conversion.toFixed(1)}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0.1" 
                                    max="20" 
                                    step="0.1" 
                                    .value="${state.conversion}" 
                                    id="conversion-input"
                                />
                            </div>

                            <div class="control-group">
                                <div class="control-header">
                                    <span class="label">Average Spend</span>
                                    <span class="value">$${state.spend}</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="500" 
                                    step="5" 
                                    .value="${state.spend}" 
                                    id="spend-input"
                                />
                            </div>

                            <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 0.5rem 0;" />

                            <!-- Render SettingsPanel -->
                            <settings-panel></settings-panel>
                        </div>

                        <!-- Statistics Outputs Card -->
                        <div class="stats-grid">
                            <div class="stat-card">
                                <span class="stat-title">Active Customers</span>
                                <span class="stat-value">${metrics.activeCustomers.toLocaleString()}</span>
                                <span class="stat-desc">Converting visitors base</span>
                            </div>

                            <div class="stat-card">
                                <span class="stat-title">Monthly Revenue</span>
                                <span class="stat-value stat-highlight">$${metrics.monthlyRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span class="stat-desc">Monthly Recurring MRR run-rate</span>
                            </div>

                            <div class="stat-card">
                                <span class="stat-title">Annualized Projection</span>
                                <span class="stat-value">$${metrics.annualProjection.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <span class="badge">Assuming +${state.growth}% growth</span>
                            </div>

                            <div class="stat-card" style="border-color: rgba(239, 68, 68, 0.05)">
                                <span class="stat-title">Projected Churn</span>
                                <span class="stat-value" style="color: #f87171">${metrics.churnedCustomers} / mo</span>
                                <span class="stat-desc" style="color: #ef4444">Estimated 4% monthly attrition</span>
                            </div>
                        </div>
                    </div>
                `
                        : `
                    <!-- Render Explorer Grid View with Fuzzy Search -->
                    <div class="search-container">
                        <input 
                            type="text" 
                            class="search-box" 
                            placeholder="Fuzzy search extensions (e.g. rust, format, docker)..." 
                            .value="${state.search}" 
                            id="search-input"
                            autofocus
                        />

                        ${
                            filteredExtensions.length > 0
                                ? `
                            <div class="menu-grid">
                                ${filteredExtensions
                                    .map(
                                        (ext) => `
                                    <div class="menu-card">
                                        <div class="menu-icon">${ext.icon}</div>
                                        <div class="menu-content">
                                            <span class="menu-category">${ext.category}</span>
                                            <span class="menu-title">${ext.name}</span>
                                            <span class="menu-desc">${ext.description}</span>
                                            <div class="menu-tags">
                                                ${ext.tags.map((tag) => `<span class="tag">#${tag}</span>`).join("")}
                                            </div>
                                        </div>
                                    </div>
                                `,
                                    )
                                    .join("")}
                            </div>
                        `
                                : `
                            <div class="no-results">
                                <p>🔍 No extensions matched your search term "${state.search}"</p>
                            </div>
                        `
                        }
                    </div>
                `
                }
            </div>
        `;

        // Bind event listeners for Nav Tabs
        this.shadow.getElementById("tab-dashboard")?.addEventListener("click", () => {
            state.tab = "dashboard";
        });
        this.shadow.getElementById("tab-explorer")?.addEventListener("click", () => {
            state.tab = "explorer";
        });

        // Bind event listeners for Dashboard inputs
        if (state.tab === "dashboard") {
            this.shadow.getElementById("users-input")?.addEventListener("input", (e) => {
                state.users = Number.parseInt((e.target as HTMLInputElement).value);
            });

            this.shadow.getElementById("conversion-input")?.addEventListener("input", (e) => {
                state.conversion = Number.parseFloat((e.target as HTMLInputElement).value);
            });

            this.shadow.getElementById("spend-input")?.addEventListener("input", (e) => {
                state.spend = Number.parseInt((e.target as HTMLInputElement).value);
            });
        }

        // Bind event listener for Explorer search
        if (state.tab === "explorer") {
            const searchInput = this.shadow.getElementById("search-input") as HTMLInputElement;
            searchInput?.addEventListener("input", (e) => {
                state.search = (e.target as HTMLInputElement).value;
            });
            // Restore focus and cursor position to prevent loss of focus on re-render
            if (searchInput) {
                searchInput.focus();
                const val = searchInput.value;
                searchInput.value = "";
                searchInput.value = val;
            }
        }
    }
}

customElements.define("dashboard-app", DashboardApp);
