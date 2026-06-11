import embed, { VisualizationSpec } from "vega-embed";

export class VegaChartComponent extends HTMLElement {
    private _spec: VisualizationSpec | null = null;

    set spec(value: VisualizationSpec) {
        this._spec = value;
        this.render();
    }

    private async render() {
        if (this._spec) {
            await embed(this, this._spec, { actions: false });
        }
    }
}

customElements.define("vega-chart", VegaChartComponent);
