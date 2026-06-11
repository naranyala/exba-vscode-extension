import { ExbaComponent, defineComponent, html } from "../core/exba";
import { css as gooberCss } from "goober";
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
        if (this.mapInitialized) return;
        const el = this.shadow.querySelector(`.${this.classes.container}`);
        if (!el) return;
        // Use imported Leaflet instance
        const map = L.map(el).setView([51.505, -0.09], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        this.mapInitialized = true;
    }

    template() {
        return html`
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
            <div class="${this.classes.container}"></div>
        `;
    }

    styles() {
        return `:host { display: block; width: 100%; }`;
    }
}

defineComponent('exba-leaflet-demo', LeafletDemo);
