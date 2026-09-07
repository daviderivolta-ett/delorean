import * as maplibregl from 'maplibre-gl'
import style from 'maplibre-gl/dist/maplibre-gl.css?raw'

import { Delorean, MaplibreglRasterTimeLayer, DeloreanController, type MaplibreglRasterTimeLayerOptions } from 'timedimension'

export class Maplibre extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: maplibregl.Map;
    #delorean?: Delorean;
    #deloreanController?: DeloreanController;

    #layers: Object[] = [];

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(this.#html().content.cloneNode(true));
        this.shadowRoot.appendChild(this.#css().cloneNode(true));

        const maplibreStyleSheet: CSSStyleSheet = new CSSStyleSheet();
        maplibreStyleSheet.replaceSync(style);
        this.shadowRoot.adoptedStyleSheets.push(maplibreStyleSheet);

        this.#deloreanController = this.shadowRoot.querySelector('#delorean') as DeloreanController;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="maplibre" class="maplibre"></div>
            <delorean-controller id="delorean" class="delorean-controller"></delorean-controller>
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

            .delorean-controller {
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
            if (!this.#map || !this.#deloreanController) return;
            this.#deloreanController.time = newTime;
        });
        /* END EXAMPLE */
    }

    #setup(): void {
        this.addEventListener('timedimension-firsttime', () => this.#delorean?.firstTime());
        this.addEventListener('timedimension-prevtime', () => this.#delorean?.prevTime());
        this.addEventListener('timedimension-nexttime', () => this.#delorean?.nextTime());
        this.addEventListener('timedimension-lasttime', () => this.#delorean?.lastTime());
        this.addEventListener('timedimension-play', (e: Event) => this.#delorean?.togglePlay((e as CustomEvent).detail, 1000));
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