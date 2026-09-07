import * as leaflet from 'leaflet'
import style from 'leaflet/dist/leaflet.css?raw'

import { Delorean, TimedimensionComponent, LeafletRasterTimeLayer, type LeafletRasterTimeLayerOptions } from 'timedimension'

export class Leaflet extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: leaflet.Map;
    #delorean?: Delorean;
    #timedimensionComponent?: TimedimensionComponent;

    #layers: Object[] = [];

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(this.#html().content.cloneNode(true));
        this.shadowRoot.appendChild(this.#css().cloneNode(true));

        const leafletStylesheet: CSSStyleSheet = new CSSStyleSheet();
        leafletStylesheet.replaceSync(style);
        this.shadowRoot.adoptedStyleSheets.push(leafletStylesheet);

        this.#timedimensionComponent = this.shadowRoot.querySelector('#timedimension') as TimedimensionComponent;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="leaflet" class="leaflet"></div>
            <app-timedimension id="timedimension" class="timedimension"></app-timedimension>
            `
            ;
        return template;
    }

    #css(): HTMLStyleElement {
        const style = document.createElement('style');
        style.innerHTML =
            `
            .leaflet {
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
        const container = this.shadowRoot?.querySelector('#leaflet');
        if (!(container instanceof HTMLElement)) return;

        this.#map = leaflet.map(container, { zoomControl: false })
            .setView([44.40370599796929, 8.928584505583844], 9)
            .addLayer(leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png'))


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
        this.addEventListener('timedimension-play', (e: Event) => this.#delorean?.togglePlay((e as CustomEvent).detail, 3000));
    }

    public async addWmsTimeLayer(options: LeafletRasterTimeLayerOptions) {
        if (!this.#map || !this.#delorean) return;
        const wmsTimeLayer = new LeafletRasterTimeLayer(this.#delorean, options);
        await wmsTimeLayer.addTo(this.#map, 1787196600000, 'intersect');
        this.#layers.push(wmsTimeLayer);
    }

    public removeWmsTimeLayer(layerId: string) {
        const foundLayer = this.#layers.find((l: Object): l is LeafletRasterTimeLayer => l instanceof LeafletRasterTimeLayer && l.layerId === layerId);
        if (!this.#map || !foundLayer) return;
        foundLayer.removeFrom(this.#map);
        this.#layers = this.#layers.filter((l) => l instanceof LeafletRasterTimeLayer && l.layerId !== foundLayer.layerId);
    }
}

customElements.define('app-leaflet', Leaflet)