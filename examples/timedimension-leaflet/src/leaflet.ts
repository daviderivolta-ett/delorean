/* Dependencies */
import * as leaflet from 'leaflet'
import style from 'leaflet/dist/leaflet.css?raw'

/* Types */
import { Delorean, LeafletRasterTimeLayer, type LeafletRasterTimeLayerOptions } from 'delorean'

/* Components */
import { DeloreanController } from 'delorean'

/* Class */
export class Leaflet extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: leaflet.Map;
    #delorean?: Delorean;
    #deloreanController?: DeloreanController;

    #layers: Object[] = [];

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(this.#html().content.cloneNode(true));
        this.shadowRoot.appendChild(this.#css().cloneNode(true));

        const leafletStylesheet: CSSStyleSheet = new CSSStyleSheet();
        leafletStylesheet.replaceSync(style);
        this.shadowRoot.adoptedStyleSheets.push(leafletStylesheet);

        /**
         * Get Delorean controller instance from Shadowroot
         */
        this.#deloreanController = this.shadowRoot.querySelector('#timedimension') as DeloreanController;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="leaflet" class="leaflet"></div>
            <delorean-controller id="timedimension" class="timedimension"></delorean-controller>
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


        /**
         * Update Delorean controller current date UI
         */
        this.#delorean = new Delorean();
        this.#delorean.addTimeChangedCallback((newTime: number) => {
            if (!this.#map || !this.#deloreanController) return;
            this.#deloreanController.time = newTime;
        });
    }

    #setup(): void {
        /**
         * Connect Delorean controller ui with Delorean store class
         */
        this.addEventListener('timedimension-firsttime', () => this.#delorean?.firstTime());
        this.addEventListener('timedimension-prevtime', () => this.#delorean?.prevTime());
        this.addEventListener('timedimension-nexttime', () => this.#delorean?.nextTime());
        this.addEventListener('timedimension-lasttime', () => this.#delorean?.lastTime());
        this.addEventListener('timedimension-play', (e: Event) => this.#delorean?.togglePlay((e as CustomEvent).detail, 3000));
    }

    public async addWmsTimeLayer(options: LeafletRasterTimeLayerOptions) {
        if (!this.#map || !this.#delorean) return;
        /**
         * Create Leaflet raster layer wrapper
         * and add to Leaflet map instance
         */
        const wmsTimeLayer = new LeafletRasterTimeLayer(this.#delorean, options);
        await wmsTimeLayer.addTo(this.#map, 1787196600000, 'intersect');
        this.#layers.push(wmsTimeLayer);
    }

    public removeWmsTimeLayer(layerId: string) {
        const foundLayer = this.#layers.find((l: Object): l is LeafletRasterTimeLayer => l instanceof LeafletRasterTimeLayer && l.layerId === layerId);
        if (!this.#map || !foundLayer) return;
        /**
         * Remove Leaflet raster layer wrapper from Leaflet instance map
         */
        foundLayer.removeFrom(this.#map);
        this.#layers = this.#layers.filter((l) => l instanceof LeafletRasterTimeLayer && l.layerId !== foundLayer.layerId);
    }
}

customElements.define('app-leaflet', Leaflet)