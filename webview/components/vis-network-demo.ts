import { css as gooberCss } from "goober";
import { DataSet, Network } from "vis-network/standalone";
import { ExbaComponent, defineComponent, html, onAfterRender } from "../core/exba";

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
        onAfterRender(() => this.initNetwork());
    }

    private initNetwork() {
        if (this.networkInitialized) return;
        const el = this.shadow.querySelector(`.${this.classes.container}`);
        if (!el) return;
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
        new Network(el, data, options);
        this.networkInitialized = true;
    }

    template() {
        return html`
            <link rel="stylesheet" href="https://unpkg.com/vis-network@9.1.6/dist/vis-network.min.css">
            <div class="${this.classes.container}"></div>
        `;
    }

    styles() {
        return ":host { display: block; width: 100%; }";
    }
}

defineComponent("exba-vis-network-demo", VisNetworkDemo);
