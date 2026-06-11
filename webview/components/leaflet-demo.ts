import { ExbaComponent, defineComponent, html } from "../core/exba";
import { css as gooberCss } from "goober";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const styles = {
    container: (css: any) => css`
        width: 100%;
        height: 500px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
    `,
};

export class LeafletDemo extends ExbaComponent {
    private gCss: any;
    private classes!: { container: string };
    private mapEl: HTMLElement | null = null;
    private mapInitialized = false;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
        };
        super.connectedCallback();
        // Initialize Leaflet map after container is rendered
        requestAnimationFrame(() => this.initMap());
    }

    private initMap() {
        if (this.mapInitialized || !this.mapEl) return;
        // Use imported Leaflet instance
        const map = L.map(this.mapEl).setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        this.mapInitialized = true;
    }

    template() {
        return html`<div class="${this.classes.leafletContainer}" ref=${(el: any) => (this.mapEl = el)}></div>`;
    }

    styles() {
        return `:host { display: block; width: 100%; }`;
    }
}

defineComponent('exba-leaflet-demo', LeafletDemo);
