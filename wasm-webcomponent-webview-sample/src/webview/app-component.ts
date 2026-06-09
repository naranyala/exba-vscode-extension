import { WasmComponent } from './wasm-framework';

interface DashboardState {
    users: number;
    conversion: number;
    spend: number;
}

export class DashboardApp extends WasmComponent {
    private state: DashboardState;

    constructor() {
        super();
        // Setup initial reactive state
        this.state = this.createState({
            users: 25000,
            conversion: 3.5,
            spend: 55
        });
    }

    connectedCallback() {
        // Render once initialized
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

        // Call the Rust WebAssembly calculation engine
        wasm.calculate_metrics(this.state.users, this.state.conversion, this.state.spend);
        
        // Retrieve and parse JSON from Rust's shared memory buffer
        const metrics = JSON.parse(this.getWasmString());

        // Render shadow DOM structure with premium styling
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
                    gap: 2rem;
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

                <div class="grid">
                    <!-- Inputs Card -->
                    <div class="card-controls">
                        <!-- Total Visitors -->
                        <div class="control-group">
                            <div class="control-header">
                                <span class="label">Audience Size</span>
                                <span class="value">${this.state.users.toLocaleString()}</span>
                            </div>
                            <input 
                                type="range" 
                                min="1000" 
                                max="100000" 
                                step="500" 
                                .value="${this.state.users}" 
                                id="users-input"
                            />
                        </div>

                        <!-- Conversion Rate -->
                        <div class="control-group">
                            <div class="control-header">
                                <span class="label">Conversion Rate</span>
                                <span class="value">${this.state.conversion.toFixed(1)}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" 
                                max="20" 
                                step="0.1" 
                                .value="${this.state.conversion}" 
                                id="conversion-input"
                            />
                        </div>

                        <!-- Average Ticket Spend -->
                        <div class="control-group">
                            <div class="control-header">
                                <span class="label">Average Spend</span>
                                <span class="value">$${this.state.spend}</span>
                            </div>
                            <input 
                                type="range" 
                                min="5" 
                                max="500" 
                                step="5" 
                                .value="${this.state.spend}" 
                                id="spend-input"
                            />
                        </div>
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
                            <span class="stat-value stat-highlight">$${metrics.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span class="stat-desc">Monthly Recurring MRR run-rate</span>
                        </div>

                        <div class="stat-card">
                            <span class="stat-title">Annualized Projection</span>
                            <span class="stat-value">$${metrics.annualProjection.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span class="badge">Assuming +18% growth</span>
                        </div>

                        <div class="stat-card" style="border-color: rgba(239, 68, 68, 0.05)">
                            <span class="stat-title">Projected Churn</span>
                            <span class="stat-value" style="color: #f87171">${metrics.churnedCustomers} / mo</span>
                            <span class="stat-desc" style="color: #ef4444">Estimated 4% monthly attrition</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind event listeners to controls
        this.shadow.getElementById('users-input')?.addEventListener('input', (e) => {
            this.state.users = parseInt((e.target as HTMLInputElement).value);
        });

        this.shadow.getElementById('conversion-input')?.addEventListener('input', (e) => {
            this.state.conversion = parseFloat((e.target as HTMLInputElement).value);
        });

        this.shadow.getElementById('spend-input')?.addEventListener('input', (e) => {
            this.state.spend = parseInt((e.target as HTMLInputElement).value);
        });
    }
}

customElements.define('dashboard-app', DashboardApp);
