import { type ResourceState, createResource, memo, signal } from "../core/exba";
import { WasmBridge } from "../core/wasm-bridge";

export const [getUsers, setUsers] = signal(25000);
export const [getConversion, setConversion] = signal(3.5);
export const [getSpend, setSpend] = signal(55);
export const [getGrowth, setGrowth] = signal(18);
export const [getTab, setTab] = signal<"dashboard" | "explorer">("explorer");
export const [getSearch, setSearch] = signal("");

export const [getWasmReady, setWasmReady] = signal(false);

export const [getGridSearch, setGridSearch] = signal("");

export interface TabItem {
    name: string;
    icon: string;
    category: string;
    description: string;
    tags: string[];
}
export const [getOpenTabs, setOpenTabs] = signal<TabItem[]>([]);
export const [getActiveTabName, setActiveTabName] = signal<string>("home");

export interface ExtensionItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
}

export const EXTENSIONS: ExtensionItem[] = [
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

export interface GridItem {
    name: string;
    description: string;
    category: string;
    icon: string;
    tags: string[];
    action: string;
}

export const GRID_ITEMS: GridItem[] = [
    {
        name: "Accordion Component",
        description: "Collapsible accordion component with declarative templates.",
        category: "Component Examples",
        icon: "🧩",
        tags: ["accordion", "components", "web", "shadow-dom"],
        action: "extensionAction",
    },
    {
        name: "TreeView Component",
        description: "Recursive folder tree component with stateful expansion.",
        category: "Component Examples",
        icon: "🌳",
        tags: ["treeview", "recursive", "components", "shadow-dom"],
        action: "extensionAction",
    },
    {
        name: "Kanban Board",
        description: "Drag-and-drop Kanban board layout using CSS grid.",
        category: "Component Examples",
        icon: "📋",
        tags: ["kanban", "drag", "drop", "layout"],
        action: "extensionAction",
    },
    {
        name: "Tabs Component",
        description: "Generic layout component to segment content into swappable panes.",
        category: "Component Examples",
        icon: "🗂️",
        tags: ["tabs", "layout", "navigation", "panes"],
        action: "extensionAction",
    },
    {
        name: "Calendar Date Picker",
        description: "Monthly calendar grid picker with month navigation and selected state.",
        category: "Component Examples",
        icon: "📅",
        tags: ["calendar", "datepicker", "date", "monthly"],
        action: "extensionAction",
    },
    {
        name: "Geolocation API",
        description: "Request and display real-time GPS coordinate data.",
        category: "Browser API",
        icon: "📍",
        tags: ["geolocation", "gps", "location", "browser"],
        action: "extensionAction",
    },
    {
        name: "Notification API",
        description: "Send native desktop toast/banner notifications.",
        category: "Browser API",
        icon: "🔔",
        tags: ["notification", "toast", "banner", "browser"],
        action: "extensionAction",
    },
    {
        name: "Local Storage API",
        description: "Save, retrieve and sync persistent key-value data.",
        category: "Browser API",
        icon: "💾",
        tags: ["storage", "localstorage", "persist", "browser"],
        action: "extensionAction",
    },
    {
        name: "SQLite Explorer",
        description: "Import, view, and edit SQLite databases entirely in the browser.",
        category: "component exploration",
        icon: "🗄️",
        tags: ["sqlite", "database", "sql"],
        action: "extensionAction",
    },
    {
        name: "Web Share API",
        description: "Invoke the native OS sharing dialog for links/text.",
        category: "Browser API",
        icon: "📤",
        tags: ["share", "webshare", "native", "browser"],
        action: "extensionAction",
    },
    {
        name: "Component Exploration",
        description: "Exploring VS Code Extension API capabilities.",
        category: "component exploration",
        icon: "🔌",
        tags: ["vscode", "api", "extension"],
        action: "extensionAction",
    },
    {
        name: "Leaflet Demo",
        description: "Interactive map using Leaflet.js library.",
        category: "component exploration",
        icon: "🗺️",
        tags: ["leaflet", "map", "interactive"],
        action: "extensionAction",
    },
    {
        name: "Vis Network Demo",
        description: "Mind-map style network visualization with vis-network.",
        category: "component exploration",
        icon: "🧠",
        tags: ["vis", "network", "mindmap"],
        action: "extensionAction",
    },
    {
        name: "Audio Player",
        description: "Audio player with waveform visualization.",
        category: "component exploration",
        icon: "🎵",
        tags: ["audio", "waveform", "player"],
        action: "extensionAction",
    },
    {
        name: "WASM Text Format",
        description:
            "Format text via WASM string-return export (uppercase, lowercase, word count).",
        category: "WASM Examples",
        icon: "📝",
        tags: ["wasm", "format", "string", "rust"],
        action: "extensionAction",
    },
    {
        name: "Browser Tabs Manager",
        description: "Visual and JSON manager for browser tabs. Real-time reactivity.",
        category: "Mini Apps Lab",
        icon: "📑",
        tags: ["json", "manager", "tabs", "reactivity"],
    },
];

export interface TreeNode {
    name: string;
    children?: TreeNode[];
}

function getWasm() {
    getWasmReady();
    return WasmBridge.instance.isReady ? WasmBridge.instance : null;
}

function wasmMemo<T, F>(fn: (wasm: WasmBridge) => T, fallback: F): () => T | F {
    return memo(() => {
        const wasm = getWasm();
        if (!wasm) return fallback;
        try {
            return fn(wasm);
        } catch (e) {
            console.error("[WASM] memo failed:", e);
            return fallback;
        }
    });
}

export const getMetrics = wasmMemo(
    (wasm) => wasm.calculateMetrics(getUsers(), getConversion(), getSpend(), getGrowth()),
    null,
);

export const getChartData = wasmMemo((wasm) => {
    const metrics = getMetrics();
    if (!metrics) return [];
    return wasm.generateChartData(metrics.monthlyRevenue, getGrowth());
}, []);

function scoreItems<
    T extends { name: string; description: string; category: string; tags: string[] },
>(items: T[], search: string, wasm: WasmBridge): (T & { score: number })[] {
    if (!search) return items.map((item) => ({ ...item, score: 100 }));
    return items
        .map((item) => {
            const targetText = `${item.name} ${item.description} ${item.category} ${item.tags.join(" ")}`;
            return { ...item, score: wasm.scoreSearch(search, targetText) };
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);
}

export const getFilteredExtensions = wasmMemo(
    (wasm) => scoreItems(EXTENSIONS, getSearch().toLowerCase().trim(), wasm),
    [],
);

export const getFilteredGridItems = wasmMemo(
    (wasm) => scoreItems(GRID_ITEMS, getGridSearch().toLowerCase().trim(), wasm),
    [],
);

export function createWasmResource<T>(
    fn: (wasm: WasmBridge) => Promise<T>,
): [() => ResourceState<T>, () => void] {
    const [getState, load] = createResource<T>(() => {
        const wasm = getWasm();
        if (!wasm) return Promise.reject(new Error("WASM not ready"));
        return fn(wasm);
    });
    return [getState, load];
}
