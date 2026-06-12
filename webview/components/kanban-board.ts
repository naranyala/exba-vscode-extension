import {
    ExbaComponent,
    createList,
    css,
    defineComponent,
    html,
    onAfterRender,
    onCleanup,
    signal,
} from "../core/exba";

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

    private _listCleanups: (() => void)[] = [];

    connectedCallback() {
        super.connectedCallback();
        onAfterRender(() => {
            for (const c of this._listCleanups) c();
            this._listCleanups = [
                createList(
                    () => this._cards[0]().filter((c) => c.column === "todo"),
                    (c) => c.id,
                    (card) => this._renderCard(card, ["delete-btn", "move-right-btn"]),
                    () => this.shadow.querySelector(".todo-cards"),
                ),
                createList(
                    () => this._cards[0]().filter((c) => c.column === "progress"),
                    (c) => c.id,
                    (card) =>
                        this._renderCard(card, ["move-left-btn", "delete-btn", "move-right-btn"]),
                    () => this.shadow.querySelector(".progress-cards"),
                ),
                createList(
                    () => this._cards[0]().filter((c) => c.column === "done"),
                    (c) => c.id,
                    (card) => this._renderCard(card, ["move-left-btn", "delete-btn"]),
                    () => this.shadow.querySelector(".done-cards"),
                ),
            ];
        });
        onCleanup(() => {
            for (const c of this._listCleanups) c();
            this._listCleanups = [];
        });
    }

    private _renderCard(card: KanbanCard, buttons: string[]): HTMLElement {
        const div = document.createElement("div");
        div.className = "card";
        div.setAttribute("data-key", card.id);

        const title = document.createElement("span");
        title.className = "card-title";
        title.textContent = card.title;
        div.appendChild(title);

        const actions = document.createElement("div");
        actions.className = "card-actions";

        if (buttons.includes("move-left-btn")) {
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.textContent = "←";
            btn.addEventListener("click", () => this._moveCard(card.id, "left"));
            actions.appendChild(btn);
        }

        if (buttons.includes("delete-btn")) {
            const btn = document.createElement("button");
            btn.className = "action-btn delete-btn";
            btn.textContent = "✕";
            btn.addEventListener("click", () => this._deleteCard(card.id));
            actions.appendChild(btn);
        }

        if (buttons.includes("move-right-btn")) {
            const btn = document.createElement("button");
            btn.className = "action-btn";
            btn.textContent = "→";
            btn.addEventListener("click", () => this._moveCard(card.id, "right"));
            actions.appendChild(btn);
        }

        div.appendChild(actions);
        return div;
    }

    private _moveCard(id: string, dir: "left" | "right") {
        const [get, set] = this._cards;
        set(
            get().map((card) => {
                if (card.id !== id) return card;
                const nextCol =
                    dir === "left"
                        ? card.column === "done"
                            ? "progress"
                            : "todo"
                        : card.column === "todo"
                          ? "progress"
                          : "done";
                return { ...card, column: nextCol };
            }),
        );
    }

    private _deleteCard(id: string) {
        const [get, set] = this._cards;
        set(get().filter((card) => card.id !== id));
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
                        <div class="todo-cards"></div>
                    </div>

                    <div class="column">
                        <div class="column-header column-progress">
                            <span>In Progress</span>
                            <span class="card-count">${progressCards.length}</span>
                        </div>
                        <div class="progress-cards"></div>
                    </div>

                    <div class="column">
                        <div class="column-header column-done">
                            <span>Done</span>
                            <span class="card-count">${doneCards.length}</span>
                        </div>
                        <div class="done-cards"></div>
                    </div>
                </div>
            </div>
        `;
    }
}
defineComponent("exba-kanban", KanbanBoard);
