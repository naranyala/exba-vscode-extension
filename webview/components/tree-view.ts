import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, signal } from "../core/exba";
import type { TreeNode } from "./state";

const styles = {
    node: (css: any) => css`
        user-select: none;
    `,
    label: (css: any) => css`
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.25rem 0.4rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
        color: #cbd5e1;
        transition: background 0.15s ease;
        width: 100%;
        border: none;
        background: none;
        text-align: left;
        font-family: inherit;
        &:hover {
            background: rgba(255, 255, 255, 0.05);
        }
    `,
    children: (css: any) => css`
        margin-left: 1rem;
        border-left: 1px solid rgba(255, 255, 255, 0.06);
        padding-left: 0.5rem;
    `,
    icon: (css: any) => css`
        font-size: 0.75rem;
        width: 14px;
        text-align: center;
        flex-shrink: 0;
    `,
    name: (css: any) => css`
        flex: 1;
    `,
    chevron: (css: any) => css`
        font-size: 0.55rem;
        color: #64748b;
        transition: transform 0.2s ease;
        width: 10px;
        text-align: center;
        &.expanded {
            transform: rotate(90deg);
        }
    `,
};

export class TreeView extends ExbaComponent {
    private _expanded = signal<Set<string>>(new Set(["src"]));
    private gCss: any;
    private classes!: {
        node: string;
        label: string;
        children: string;
        icon: string;
        name: string;
        chevron: string;
    };

    private treeData: TreeNode[] = [
        {
            name: "src",
            children: [
                {
                    name: "components",
                    children: [{ name: "app-component.ts" }, { name: "settings-panel.ts" }],
                },
                {
                    name: "core",
                    children: [
                        { name: "exba.ts" },
                        { name: "utils.ts" },
                        { name: "vscode-service.ts" },
                    ],
                },
                { name: "main.ts" },
            ],
        },
        {
            name: "rust",
            children: [{ name: "Cargo.toml" }, { name: "src/lib.rs" }],
        },
        { name: "package.json" },
        { name: "tsconfig.json" },
    ];

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.initStyles();
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    private initStyles() {
        this.classes = {
            node: styles.node(this.gCss),
            label: styles.label(this.gCss),
            children: styles.children(this.gCss),
            icon: styles.icon(this.gCss),
            name: styles.name(this.gCss),
            chevron: styles.chevron(this.gCss),
        };
    }

    handleToggle(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const path = btn.getAttribute("data-path") || "";
        const [get, set] = this._expanded;
        const current = new Set(get());
        if (current.has(path)) {
            current.delete(path);
        } else {
            current.add(path);
        }
        set(current);
    }

    private renderNode(node: TreeNode, parentPath: string): string {
        const path = parentPath ? `${parentPath}/${node.name}` : node.name;
        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = this._expanded[0]().has(path);
        const isFile = !hasChildren;
        const icon = isFile
            ? node.name.endsWith(".ts")
                ? "📄"
                : node.name.endsWith(".rs")
                  ? "🦀"
                  : node.name.endsWith(".json")
                    ? "📦"
                    : "📋"
            : isExpanded
              ? "📂"
              : "📁";

        return html`
            <div class="${this.classes.node}">
                <button class="${this.classes.label}" on-click="handleToggle" data-path="${path}">
                    ${hasChildren ? html`<span class="${this.classes.chevron}${isExpanded ? " expanded" : ""}">▶</span>` : html`<span class="${this.classes.chevron}"></span>`}
                    <span class="${this.classes.icon}">${icon}</span>
                    <span class="${this.classes.name}">${node.name}</span>
                </button>
                ${
                    hasChildren && isExpanded
                        ? html`
                    <div class="${this.classes.children}">
                        ${node.children?.map((child) => this.renderNode(child, path)).join("")}
                    </div>
                `
                        : ""
                }
            </div>
        `;
    }

    template() {
        return html`
            <div>
                ${this.treeData.map((node) => this.renderNode(node, "")).join("")}
            </div>
        `;
    }
}
defineComponent("exba-tree-view", TreeView);
