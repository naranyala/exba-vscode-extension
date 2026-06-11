import { ExbaComponent, css, defineComponent, html, signal } from "../core/exba";

interface KanbanCard {
    id: string;
    title: string;
    column: "todo" | "progress" | "done";
}

export class KanbanBoard extends ExbaComponent {
    private _cards = signal<KanbanCard[]>([
        { id: "1", title: "Design UI tokens", column: "todo" },
        { id: "2", title: "Integrate Rust WASM", column: "todo" },
        { id: "3", title: "Write component tests", column: "progress" },
        { id: "4", title: "Link local editors", column: "done" },
    ]);
    private _newCardTitle = signal("");

    styles() {
        return css`
            :host {
                display: block;
                font-family: inherit;
            }
            .board-container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .input-group {
                display: flex;
                gap: 0.5rem;
            }
            .input-field {
                flex: 1;
                padding: 0.45rem 0.75rem;
                background: rgba(15, 23, 42, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #ffffff;
                font-size: 0.75rem;
                outline: none;
            }
            .input-field:focus {
                border-color: #a78bfa;
            }
            .columns {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            @media (min-width: 600px) {
                .columns {
                    flex-direction: row;
                }
            }
            .column {
                flex: 1;
                background: rgba(15, 23, 42, 0.25);
                border: 1px solid rgba(255, 255, 255, 0.04);
                border-radius: 12px;
                padding: 0.75rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                min-height: 150px;
            }
            .column-header {
                font-size: 0.7rem;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 0.25rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .column-todo { color: #f87171; }
            .column-progress { color: #60a5fa; }
            .column-done { color: #34d399; }
            .card-count {
                background: rgba(255, 255, 255, 0.06);
                padding: 0.1rem 0.35rem;
                border-radius: 99px;
                font-size: 0.6rem;
                color: #94a3b8;
            }
            .card {
                background: rgba(30, 41, 59, 0.5);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                padding: 0.6rem;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .card-title {
                font-size: 0.75rem;
                color: #e2e8f0;
                word-break: break-word;
            }
            .card-actions {
                display: flex;
                justify-content: flex-end;
                gap: 0.3rem;
            }
            .action-btn {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #cbd5e1;
                border-radius: 4px;
                padding: 0.15rem 0.35rem;
                font-size: 0.6rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .action-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            .delete-btn {
                color: #ef4444;
            }
            .delete-btn:hover {
                background: rgba(239, 68, 68, 0.15);
                border-color: rgba(239, 68, 68, 0.2);
            }
        `;
    }

    handleInput(e: Event) {
        this._newCardTitle[1]((e.target as HTMLInputElement).value);
    }

    handleAddCard() {
        const title = this._newCardTitle[0]().trim();
        if (!title) return;

        const [get, set] = this._cards;
        const newCard: KanbanCard = {
            id: Date.now().toString(),
            title,
            column: "todo",
        };

        set([...get(), newCard]);
        this._newCardTitle[1]("");
    }

    handleMoveLeft(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const id = btn.getAttribute("data-id");
        const [get, set] = this._cards;

        set(
            get().map((card) => {
                if (card.id === id) {
                    const nextCol = card.column === "done" ? "progress" : "todo";
                    return { ...card, column: nextCol };
                }
                return card;
            }),
        );
    }

    handleMoveRight(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const id = btn.getAttribute("data-id");
        const [get, set] = this._cards;

        set(
            get().map((card) => {
                if (card.id === id) {
                    const nextCol = card.column === "todo" ? "progress" : "done";
                    return { ...card, column: nextCol };
                }
                return card;
            }),
        );
    }

    handleDelete(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const id = btn.getAttribute("data-id");
        const [get, set] = this._cards;

        set(get().filter((card) => card.id !== id));
    }

    template() {
        const cards = this._cards[0]();
        const newTitle = this._newCardTitle[0]();

        const todoCards = cards.filter((c) => c.column === "todo");
        const progressCards = cards.filter((c) => c.column === "progress");
        const doneCards = cards.filter((c) => c.column === "done");

        return html`
            <div class="board-container">
                <div class="input-group">
                    <input 
                        type="text" 
                        class="input-field" 
                        placeholder="Add a new task..." 
                        value="${newTitle}"
                        on-input="handleInput"
                        on-change="handleAddCard"
                    />
                    <button class="action-btn" on-click="handleAddCard" style="padding: 0.45rem 1rem; border-radius: 8px;">
                        Add Task
                    </button>
                </div>

                <div class="columns">
                    <div class="column">
                        <div class="column-header column-todo">
                            <span>To Do</span>
                            <span class="card-count">${todoCards.length}</span>
                        </div>
                        ${todoCards
                            .map(
                                (card) => html`
                            <div class="card">
                                <span class="card-title">${card.title}</span>
                                <div class="card-actions">
                                    <button class="action-btn delete-btn" on-click="handleDelete" data-id="${card.id}">✕</button>
                                    <button class="action-btn" on-click="handleMoveRight" data-id="${card.id}">→</button>
                                </div>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>

                    <div class="column">
                        <div class="column-header column-progress">
                            <span>In Progress</span>
                            <span class="card-count">${progressCards.length}</span>
                        </div>
                        ${progressCards
                            .map(
                                (card) => html`
                            <div class="card">
                                <span class="card-title">${card.title}</span>
                                <div class="card-actions">
                                    <button class="action-btn" on-click="handleMoveLeft" data-id="${card.id}">←</button>
                                    <button class="action-btn delete-btn" on-click="handleDelete" data-id="${card.id}">✕</button>
                                    <button class="action-btn" on-click="handleMoveRight" data-id="${card.id}">→</button>
                                </div>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>

                    <div class="column">
                        <div class="column-header column-done">
                            <span>Done</span>
                            <span class="card-count">${doneCards.length}</span>
                        </div>
                        ${doneCards
                            .map(
                                (card) => html`
                            <div class="card">
                                <span class="card-title">${card.title}</span>
                                <div class="card-actions">
                                    <button class="action-btn" on-click="handleMoveLeft" data-id="${card.id}">←</button>
                                    <button class="action-btn delete-btn" on-click="handleDelete" data-id="${card.id}">✕</button>
                                </div>
                            </div>
                        `,
                            )
                            .join("")}
                    </div>
                </div>
            </div>
        `;
    }
}
defineComponent("exba-kanban", KanbanBoard);
