import * as maplibregl from 'maplibre-gl'
import style from 'maplibre-gl/dist/maplibre-gl.css?raw'

import { Delorean, MaplibreglRasterTimeLayer, TimedimensionComponent, type MaplibreglRasterTimeLayerOptions } from 'timedimension'

export class Maplibre extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: maplibregl.Map;
    #delorean?: Delorean;
    #timedimensionComponent?: TimedimensionComponent;

    #layers: Object[] = [];

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(this.#html().content.cloneNode(true));
        this.shadowRoot.appendChild(this.#css().cloneNode(true));

        const maplibreStyleSheet: CSSStyleSheet = new CSSStyleSheet();
        maplibreStyleSheet.replaceSync(style);
        this.shadowRoot.adoptedStyleSheets.push(maplibreStyleSheet);

        this.#timedimensionComponent = this.shadowRoot.querySelector('#timedimension') as TimedimensionComponent;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="maplibre" class="maplibre"></div>
            <app-timedimension id="timedimension" class="timedimension"></app-timedimension>
            `
            ;
        return template;
    }

    #css(): HTMLStyleElement {
        const style = document.createElement('style');
        style.innerHTML =
            `
            .maplibre {
                height: 100%;
            }

            .timedimension {
                position: fixed;
                z-index: 999;
                bottom: 40px;
                left: 40px;
            }
            `
            ;
        return style;
    }

    public connectedCallback(): void {
        this.#init();
        this.#setup();
    }

    #init(): void {
        const container = this.shadowRoot?.querySelector('#maplibre');
        if (!(container instanceof HTMLElement)) return;

        this.#map = new maplibregl.Map({
            container,
            style: 'https://tiles.openfreemap.org/styles/liberty',
            center: [
                8.928584505583844,
                44.40370599796929
            ],
            zoom: 9,
        });

        /* START EXAMPLE */
        this.#delorean = new Delorean();
        this.#delorean.addTimeChangedCallback((newTime: number) => {
            if (!this.#map || !this.#timedimensionComponent) return;
            this.#timedimensionComponent.time = newTime;
        });
        /* END EXAMPLE */
    }

    #setup(): void {
        this.addEventListener('timedimension-firsttime', () => this.#delorean?.firstTime());
        this.addEventListener('timedimension-prevtime', () => this.#delorean?.prevTime());
        this.addEventListener('timedimension-nexttime', () => this.#delorean?.nextTime());
        this.addEventListener('timedimension-lasttime', () => this.#delorean?.lastTime());
    }

    public async addWmsTimeLayer(options: MaplibreglRasterTimeLayerOptions) {
        if (!this.#map || !this.#delorean) return;
        const wmsTimeLayer = new MaplibreglRasterTimeLayer(this.#delorean, options);
        await wmsTimeLayer.addTo(this.#map);
        this.#layers.push(wmsTimeLayer);
    }

    public removeWmsTimeLayer(layerId: string) {
        const foundLayer = this.#layers.find((l: Object): l is MaplibreglRasterTimeLayer => l instanceof MaplibreglRasterTimeLayer && l.layerId === layerId);
        if (!this.#map || !foundLayer) return;
        foundLayer.removeFrom(this.#map);
    }
}

customElements.define('app-maplibre', Maplibre)