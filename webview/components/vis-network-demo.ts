import { ExbaComponent, defineComponent, html } from "../core/exba";
import { css as gooberCss } from "goober";
import 'vis-network/styles/vis-network.min.css';
import { DataSet, Network } from 'vis-network/standalone';

const styles = {
    container: (css: any) => css`
        width: 100%;
        height: 500px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        overflow: hidden;
    `,
};

export class VisNetworkDemo extends ExbaComponent {
    private gCss: any;
    private classes!: { container: string };
    private networkEl: HTMLElement | null = null;
    private networkInitialized = false;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
        };
        super.connectedCallback();
        // Initialize vis-network after container is ready
        setTimeout(() => this.initNetwork(), 0);
    }

    private initNetwork() {
        if (this.networkInitialized || !this.networkEl) return;
        if (this.networkInitialized || !this.networkEl) return;
        const nodes = new DataSet([
            { id: 1, label: "Node 1" },
            { id: 2, label: "Node 2" },
            { id: 3, label: "Node 3" },
            { id: 4, label: "Node 4" },
            { id: 5, label: "Node 5" },
        ]);
        const edges = new DataSet([
            { from: 1, to: 2 },
            { from: 1, to: 3 },
            { from: 2, to: 4 },
            { from: 2, to: 5 },
        ]);
        const data = { nodes, edges };
        const options = {};
        new Network(this.networkEl, data, options);
        this.networkInitialized = true;
    }

    template() {
        return html`<div class="${this.classes.visContainer}" ref=${(el: any) => (this.networkEl = el)}></div>`;
    }

    styles() {
        return `:host { display: block; width: 100%; }`;
    }
}

defineComponent('exba-vis-network-demo', VisNetworkDemo);
