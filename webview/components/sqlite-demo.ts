import { css as gooberCss } from "goober";
import initSqlJs from "sql.js";
import { ExbaComponent, defineComponent, html, signal, batch } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 1rem;
        height: 100%;
        color: #e2e8f0;
        font-family: inherit;
    `,
    controls: (css: any) => css`
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    `,
    button: (css: any) => css`
        padding: 0.4rem 0.8rem;
        background: #6366f1;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.75rem;
        transition: opacity 0.2s;
        &:hover { opacity: 0.9; }
        &:disabled { background: #475569; cursor: not-allowed; }
    `,
    fileInput: (css: any) => css`
        display: none;
    `,
    queryBox: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    `,
    textarea: (css: any) => css`
        width: 100%;
        min-height: 80px;
        background: rgba(15, 23, 42, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        padding: 0.5rem;
        color: #a78bfa;
        font-family: monospace;
        font-size: 0.8rem;
        resize: vertical;
        &:focus { outline: none; border-color: #6366f1; }
    `,
    error: (css: any) => css`
        color: #f87171;
        font-size: 0.75rem;
        padding: 0.5rem;
        background: rgba(248, 113, 113, 0.1);
        border-left: 3px solid #f87171;
        border-radius: 4px;
    `,
    tableContainer: (css: any) => css`
        overflow-x: auto;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        background: rgba(15, 23, 42, 0.3);
    `,
    table: (css: any) => css`
        width: 100%;
        border-collapse: collapse;
        font-size: 0.75rem;
        & th, & td {
            padding: 0.4rem 0.6rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            text-align: left;
        }
        & th {
            background: rgba(255, 255, 255, 0.05);
            font-weight: 600;
            color: #94a3b8;
        }
        & td {
            color: #e2e8f0;
        }
        & tr:hover {
            background: rgba(255, 255, 255, 0.02);
        }
    `,
    tablesList: (css: any) => css`
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-bottom: 0.5rem;
    `,
    tableBadge: (css: any) => css`
        padding: 0.2rem 0.5rem;
        background: rgba(99, 102, 241, 0.15);
        color: #a78bfa;
        border-radius: 12px;
        font-size: 0.65rem;
        cursor: pointer;
        border: 1px solid rgba(99, 102, 241, 0.3);
        &:hover { background: rgba(99, 102, 241, 0.3); }
    `
};

let SQL: any = null;

export class SqliteDemo extends ExbaComponent {
    private gCss: any;
    private classes: Record<string, string>;
    private db: any = null;

    private _status = signal<string>("Loading SQL.js...");
    private _error = signal<string>("");
    private _tables = signal<string[]>([]);
    private _query = signal<string>("SELECT * FROM sqlite_master WHERE type='table';");
    private _results = signal<{ columns: string[], values: any[][] }[]>([]);
    private _activeTable = signal<string>("");

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
        this.classes = {
            container: styles.container(this.gCss),
            controls: styles.controls(this.gCss),
            button: styles.button(this.gCss),
            fileInput: styles.fileInput(this.gCss),
            queryBox: styles.queryBox(this.gCss),
            textarea: styles.textarea(this.gCss),
            error: styles.error(this.gCss),
            tableContainer: styles.tableContainer(this.gCss),
            table: styles.table(this.gCss),
            tablesList: styles.tablesList(this.gCss),
            tableBadge: styles.tableBadge(this.gCss),
        };
    }

    async connectedCallback() {
        super.connectedCallback();
        
        if (!SQL) {
            try {
                const sqlWasmUri = document.body.dataset.sqlWasmUri;
                if (!sqlWasmUri) {
                    throw new Error("data-sql-wasm-uri not found on body.");
                }
                SQL = await initSqlJs({
                    locateFile: () => sqlWasmUri
                });
                this._status[1]("Ready to load database.");
            } catch (err: any) {
                this._status[1]("Failed to initialize SQL.js");
                this._error[1](err.message || String(err));
            }
        } else {
            this._status[1]("Ready to load database.");
        }
    }

    handleFileSelect = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            try {
                const Uints = new Uint8Array(reader.result as ArrayBuffer);
                if (this.db) {
                    this.db.close();
                }
                this.db = new SQL.Database(Uints);
                this._status[1](`Loaded: ${file.name}`);
                this._error[1]("");
                this.refreshTables();
                this.runQuery("SELECT name FROM sqlite_master WHERE type='table';");
            } catch (err: any) {
                this._error[1](`Failed to open database: ${err.message}`);
            }
        };
        reader.readAsArrayBuffer(file);
        // Reset input so the same file can be selected again
        input.value = "";
    };

    triggerFileInput = () => {
        const input = this.shadow.querySelector("input[type='file']") as HTMLInputElement;
        input?.click();
    };

    refreshTables() {
        if (!this.db) return;
        try {
            const res = this.db.exec("SELECT name FROM sqlite_master WHERE type='table';");
            if (res.length > 0 && res[0].values) {
                const tables = res[0].values.map((v: any) => v[0]);
                this._tables[1](tables);
            } else {
                this._tables[1]([]);
            }
        } catch (e) {
            console.error("Failed to list tables", e);
        }
    }

    handleQueryChange = (e: Event) => {
        this._query[1]((e.target as HTMLTextAreaElement).value);
    };

    executeCurrentQuery = () => {
        this.runQuery(this._query[0]());
    };

    runQuery(sql: string) {
        if (!this.db) {
            this._error[1]("No database loaded.");
            return;
        }
        
        batch(() => {
            try {
                const res = this.db.exec(sql);
                this._results[1](res);
                this._error[1]("");
                // If it was an insert/update/delete, we might want to refresh tables list
                if (sql.trim().toUpperCase().match(/^(CREATE|DROP|ALTER)/)) {
                    this.refreshTables();
                }
            } catch (err: any) {
                this._error[1](err.message || String(err));
                this._results[1]([]);
            }
        });
    }

    handleTableClick = (e: Event) => {
        const tableName = (e.currentTarget as HTMLElement).dataset.table;
        if (tableName) {
            this._activeTable[1](tableName);
            const sql = `SELECT * FROM "${tableName}" LIMIT 100;`;
            this._query[1](sql);
            this.runQuery(sql);
        }
    };

    handleCellEdit = (e: Event, rowIndex: number, colIndex: number) => {
        const el = e.target as HTMLElement;
        const newValue = el.textContent || "";
        const activeTable = this._activeTable[0]();
        if (!activeTable) return;
        
        const res = this._results[0]()[0];
        const row = res.values[rowIndex];
        const colName = res.columns[colIndex];
        
        // Don't update if nothing changed
        if (String(row[colIndex]) === newValue) return;
        
        const idIndex = res.columns.findIndex(c => c.toLowerCase() === 'id');
        if (idIndex === -1) {
            this._error[1]("Cannot update inline: Table must have an 'id' column.");
            el.textContent = String(row[colIndex]); // Revert
            return;
        }
        
        const idValue = row[idIndex];
        const query = `UPDATE "${activeTable}" SET "${colName}" = '${newValue.replace(/'/g, "''")}' WHERE id = ${idValue};`;
        try {
            this.db.run(query);
            this._status[1](`Updated ${activeTable} (${colName})`);
            this._error[1]("");
            // Re-run the current query to refresh
            this.runQuery(this._query[0]());
        } catch (err: any) {
            this._error[1](`Update failed: ${err.message}`);
            el.textContent = String(row[colIndex]); // Revert
        }
    };

    handleCellKeydown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLElement).blur();
        }
    };

    exportDatabase = () => {
        if (!this.db) return;
        const binaryArray = this.db.export();
        const blob = new Blob([binaryArray], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported_database.db";
        a.click();
        URL.revokeObjectURL(url);
    };

    loadDemoDb = () => {
        if (this.db) {
            this.db.close();
        }
        this.db = new SQL.Database();
        const sqlstr = `
            CREATE TABLE users (id int, name char);
            INSERT INTO users VALUES (1, 'Alice');
            INSERT INTO users VALUES (2, 'Bob');
            INSERT INTO users VALUES (3, 'Charlie');
            CREATE TABLE products (id int, item char, price int);
            INSERT INTO products VALUES (101, 'Keyboard', 45);
            INSERT INTO products VALUES (102, 'Mouse', 25);
            INSERT INTO products VALUES (103, 'Monitor', 150);
        `;
        this.db.run(sqlstr);
        
        batch(() => {
            this._status[1]("Loaded Demo Database");
            this._error[1]("");
            this._query[1]("SELECT * FROM users;");
            this.refreshTables();
            this.runQuery("SELECT * FROM users;");
        });
    };

    template() {
        const status = this._status[0]();
        const error = this._error[0]();
        const tables = this._tables[0]();
        const query = this._query[0]();
        const results = this._results[0]();
        const isReady = SQL !== null;
        const hasDb = this.db !== null;
        const activeTable = this._activeTable[0]();

        return html`
            <div class="${this.classes.container}">
                <div class="${this.classes.controls}">
                    <button class="${this.classes.button}" on-click="triggerFileInput" ?disabled="${!isReady}">
                        📂 Open SQLite DB
                    </button>
                    <button class="${this.classes.button}" on-click="loadDemoDb" ?disabled="${!isReady}" style="background: #0ea5e9;">
                        ✨ Load Demo DB
                    </button>
                    <input type="file" class="${this.classes.fileInput}" accept=".db,.sqlite,.sqlite3" on-change="handleFileSelect" />
                    
                    ${hasDb ? html`
                        <button class="${this.classes.button}" on-click="exportDatabase" style="background: #10b981; margin-left: auto;">
                            💾 Save / Export
                        </button>
                    ` : ""}
                </div>

                <div style="font-size: 0.7rem; color: #94a3b8;">
                    Status: <span style="color: #a78bfa;">${status}</span>
                </div>

                ${tables.length > 0 ? html`
                    <div>
                        <div style="font-size: 0.7rem; margin-bottom: 0.3rem; color: #94a3b8;">Tables:</div>
                        <div class="${this.classes.tablesList}">
                            ${tables.map(t => html`
                                <span class="${this.classes.tableBadge}" data-table="${t}" on-click="handleTableClick">${t}</span>
                            `).join("")}
                        </div>
                    </div>
                ` : ""}

                <div class="${this.classes.queryBox}">
                    <textarea class="${this.classes.textarea}" on-input="handleQueryChange" spellcheck="false">${query}</textarea>
                    <button class="${this.classes.button}" on-click="executeCurrentQuery" ?disabled="${!hasDb}" style="align-self: flex-start;">
                        ▶ Run Query
                    </button>
                </div>

                ${error ? html`
                    <div class="${this.classes.error}">${error}</div>
                ` : ""}

                ${results.map((res) => html`
                    <div class="${this.classes.tableContainer}">
                        <table class="${this.classes.table}">
                            <thead>
                                <tr>
                                    ${res.columns.map(c => html`<th>${c}</th>`).join("")}
                                </tr>
                            </thead>
                            <tbody>
                                ${res.values.map((row, rowIndex) => html`
                                    <tr>
                                        ${row.map((val, colIndex) => html`
                                            <td 
                                                contenteditable="${activeTable ? 'true' : 'false'}" 
                                                on-blur="${(e: Event) => this.handleCellEdit(e, rowIndex, colIndex)}"
                                                on-keydown="${this.handleCellKeydown}"
                                                style="${activeTable ? 'cursor: text; border-bottom: 1px dashed rgba(255,255,255,0.2);' : ''}"
                                            >
                                                ${val === null ? '<em>null</em>' : val}
                                            </td>
                                        `).join("")}
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                `).join("")}
                
                ${hasDb && results.length === 0 && !error ? html`
                    <div style="font-size: 0.75rem; color: #64748b; padding: 1rem; text-align: center;">
                        Query returned 0 rows.
                    </div>
                ` : ""}
            </div>
        `;
    }
}

defineComponent("exba-sqlite-demo", SqliteDemo);
