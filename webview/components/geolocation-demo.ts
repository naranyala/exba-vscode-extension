import { css as gooberCss } from "goober";
import { ExbaComponent, createResource, defineComponent, html, onMount } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.5rem;
    `,
    btn: (css: any) => css`
        background: rgba(167, 139, 250, 0.15);
        border: 1px solid rgba(167, 139, 250, 0.3);
        color: #a78bfa;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        width: fit-content;
        outline: none;
        &:hover {
            background: rgba(167, 139, 250, 0.25);
        }
        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `,
    info: (css: any) => css`
        font-size: 0.75rem;
        color: #cbd5e1;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.75rem;
        border-radius: 8px;
        font-family: monospace;
    `,
    error: (css: any) => css`
        color: #f87171;
        font-size: 0.75rem;
    `,
    loading: (css: any) => css`
        color: #94a3b8;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `,
    spinner: (css: any) => css`
        width: 12px;
        height: 12px;
        border: 2px solid rgba(167, 139, 250, 0.3);
        border-top-color: #a78bfa;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `,
};

interface GeoPosition {
    lat: number;
    lng: number;
}

function getCurrentPosition(): Promise<GeoPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser."));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => reject(new Error(err.message)),
        );
    });
}

export class GeolocationDemo extends ExbaComponent {
    private gCss: any;
    private classes!: any;
    private _getState!: () => import("../core/exba").ResourceState<GeoPosition>;
    private _load!: () => void;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
            btn: styles.btn(this.gCss),
            info: styles.info(this.gCss),
            error: styles.error(this.gCss),
            loading: styles.loading(this.gCss),
            spinner: styles.spinner(this.gCss),
        };

        const [getState, load] = createResource<GeoPosition>(() => getCurrentPosition());
        this._getState = getState;
        this._load = load;

        super.connectedCallback();
    }

    handleGetLocation() {
        this._load();
    }

    styles() {
        return ":host { display: block; }";
    }

    template() {
        const state = this._getState();
        return html`
            <div class="${this.classes.container}">
                <button class="${this.classes.btn}" on-click="handleGetLocation" ?disabled="${state.status === "loading"}">${state.status === "loading" ? "Locating..." : "Get GPS Coordinates"}</button>
                ${
                    state.status === "loading"
                        ? html`
                    <div class="${this.classes.loading}">
                        <div class="${this.classes.spinner}"></div>
                        <span>Requesting GPS position...</span>
                    </div>
                `
                        : ""
                }
                ${
                    state.status === "error"
                        ? html`
                    <div class="${this.classes.error}">Error: ${state.error}</div>
                `
                        : ""
                }
                ${
                    state.status === "ready"
                        ? html`
                    <div class="${this.classes.info}">
                        Latitude:  ${state.data.lat.toFixed(6)}<br>
                        Longitude: ${state.data.lng.toFixed(6)}
                    </div>
                `
                        : ""
                }
            </div>
        `;
    }
}
defineComponent("exba-geolocation-demo", GeolocationDemo);
