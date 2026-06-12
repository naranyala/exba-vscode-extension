import embed, { type VisualizationSpec } from "vega-embed";
import { ExbaComponent, css, defineComponent } from "../core/exba";

export class VegaChartComponent extends ExbaComponent {
    private _spec: VisualizationSpec | null = null;

    set spec(value: VisualizationSpec) {
        this._spec = value;
        this._renderChart();
    }

    styles() {
        return css`
            :host { display: block; }
            .chart-root { width: 100%; min-height: 200px; }
        `;
    }

    private _renderChart() {
        if (!this._spec) return;
        const root = this.shadow.querySelector(".chart-root") as HTMLElement;
        if (root) {
            embed(root, this._spec, { actions: false }).catch((err) =>
                console.error("[VegaChart] embed failed:", err),
            );
        }
    }

    template() {
        return `<div class="chart-root"></div>`;
    }
}

defineComponent("vega-chart", VegaChartComponent);
