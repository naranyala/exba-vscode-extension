import "../index.css";
import { ExbaComponent } from "../core/exba";
import { setWasmReady } from "./state";
import "./settings-panel";
import "./wasm-chart";
import "./accordion";
import "./tree-view";
import "./kanban-board";
import "./calendar-picker";
import "./dashboard-app";
import "./grid-menu-app";

// Export ExbaComponent as WasmComponent for webview HTML to import
export const WasmComponent = ExbaComponent;

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
