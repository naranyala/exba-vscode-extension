import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html } from "../core/exba";
import { getChartData, getGrowth } from "./state";

const styles = {
    host: (css: any) => css`
        background: rgba(30, 41, 59, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 1.5rem;
        margin-top: 1.5rem;
        overflow: hidden;
    `,
    title: (css: any) => css`
        font-size: 0.85rem;
        font-weight: 700;
        color: #94a3b8;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
    `,
    container: (css: any) => css`
        width: 100%;
        height: 180px;
        & polyline {
            fill: none;
            stroke: #a78bfa;
            stroke-width: 3;
            stroke-linecap: round;
            stroke-linejoin: round;
            filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.4));
        }
    `,
    gridLine: (css: any) => css`
        stroke: rgba(255, 255, 255, 0.05);
        stroke-width: 1;
    `,
    axisLabel: (css: any) => css`
        fill: #64748b;
        font-size: 10px;
        font-family: monospace;
    `,
};

export class WasmChart extends ExbaComponent {
    private gCss: any;
    private classes!: {
        host: string;
        title: string;
        container: string;
        gridLine: string;
        axisLabel: string;
    };

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
            host: styles.host(this.gCss),
            title: styles.title(this.gCss),
            container: styles.container(this.gCss),
            gridLine: styles.gridLine(this.gCss),
            axisLabel: styles.axisLabel(this.gCss),
        };
    }

    template() {
        const data = getChartData();
        const growth = getGrowth();
        if (data.length === 0) return "";

        const width = 600;
        const height = 180;
        const padding = 20;

        const maxY = Math.max(...data.map((d) => d.y));
        const minY = Math.min(...data.map((d) => d.y));
        const rangeY = maxY - minY || 1;

        const points = data
            .map((d) => {
                const x = padding + (d.x / 11) * (width - 2 * padding);
                const y = height - padding - ((d.y - minY) / rangeY) * (height - 2 * padding);
                return `${x},${y}`;
            })
            .join(" ");

        return html`
            <div class="${this.classes.host}">
                <div class="${this.classes.title}">
                    <span>12-Month Revenue Forecast</span>
                    <span style="color: #4ade80">+${growth}% YoY</span>
                </div>
                <div class="${this.classes.container}">
                    <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
                        <line class="${this.classes.gridLine}" x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" />
                        <line class="${this.classes.gridLine}" x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" />
                        <line class="${this.classes.gridLine}" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" />
                        <text class="${this.classes.axisLabel}" x="${padding}" y="${height - 5}">Month 0</text>
                        <text class="${this.classes.axisLabel}" x="${width - padding - 45}" y="${height - 5}">Month 12</text>
                        <polyline points="${points}" />
                    </svg>
                </div>
            </div>
        `;
    }
}
defineComponent("wasm-chart", WasmChart);
