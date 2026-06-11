import { ExbaComponent, defineComponent, html, signal } from "../core/exba";
import { css as gooberCss } from "goober";

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
};

export class GeolocationDemo extends ExbaComponent {
    private _state = signal<{ lat: number; lng: number; error: string | null }>({
        lat: 0,
        lng: 0,
        error: null,
    });
    private gCss: any;
    private classes!: any;

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
        };
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    handleGetLocation() {
        if (!navigator.geolocation) {
            this._state[1]({ lat: 0, lng: 0, error: "Geolocation is not supported by your browser." });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this._state[1]({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    error: null,
                });
            },
            (err) => {
                this._state[1]({ lat: 0, lng: 0, error: err.message });
            }
        );
    }

    template() {
        const state = this._state[0]();
        return html`
            <div class="${this.classes.container}">
                <button class="${this.classes.btn}" on-click="handleGetLocation">Get GPS Coordinates</button>
                ${state.error ? html`<div class="${this.classes.error}">Error: ${state.error}</div>` : ""}
                ${state.lat && state.lng ? html`
                    <div class="${this.classes.info}">
                        Latitude:  ${state.lat.toFixed(6)}<br>
                        Longitude: ${state.lng.toFixed(6)}
                    </div>
                ` : ""}
            </div>
        `;
    }
}
defineComponent("exba-geolocation-demo", GeolocationDemo);
