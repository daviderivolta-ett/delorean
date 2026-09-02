import * as maplibregl from 'maplibre-gl'
import style from 'maplibre-gl/dist/maplibre-gl.css?raw'

import { Delorean, MaplibreglRasterTimeLayer, TimedimensionComponent, type MaplibreglRasterTimeLayerOptions } from 'timedimension'

export class Maplibre extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: maplibregl.Map;
    // #timedimension?: Timedimension;
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
        // const times = [
        //     1786481400000,
        //     1786483200000,
        //     1786485000000,
        //     1786486800000,
        //     1786488600000,
        //     1786490400000,
        //     1786492200000,
        //     1786494000000,
        //     1786495800000,
        //     1786497600000,
        //     1786499400000,
        //     1786501200000
        // ];

        // this.#timedimension = new Timedimension(times, 1786490400000);
        // this.#timedimension = new Timedimension();
        // this.#timedimension.addTimeChangedListener((newTime: number) => {
        //     console.log(newTime);
        //     if (!this.#map || !this.#timedimensionComponent) return;

        //     this.#timedimensionComponent.time = newTime;

        //     this.#layers.forEach((l: Object) => {
        //         if (l instanceof MaplibreglRasterTimeLayer) l.setTime(this.#map!, newTime);
        //     });
        // });

        this.#delorean = new Delorean();
        this.#delorean.addTimeChangedCallback((newTime: number) => {
            // console.log(newTime);
            if (!this.#map || !this.#timedimensionComponent) return;
            this.#timedimensionComponent.time = newTime;
        });
        /* END EXAMPLE */
    }

    #setup(): void {
        // this.addEventListener('timedimension-firsttime', () => this.#timedimension?.firstTime());
        // this.addEventListener('timedimension-prevtime', () => this.#timedimension?.prevTime());
        // this.addEventListener('timedimension-nexttime', () => this.#timedimension?.nextTime());
        // this.addEventListener('timedimension-lasttime', () => this.#timedimension?.lastTime());

        this.addEventListener('timedimension-firsttime', () => this.#delorean?.firstTime());
        this.addEventListener('timedimension-prevtime', () => this.#delorean?.prevTime());
        this.addEventListener('timedimension-nexttime', () => this.#delorean?.nextTime());
        this.addEventListener('timedimension-lasttime', () => this.#delorean?.lastTime());
    }

    public async addWmsTimeLayer(options: MaplibreglRasterTimeLayerOptions) {
        // if (!this.#map) return;
        // const wmsTimeLayer = new MaplibreglWmsTimeLayer(sourceId, layerId, source, layer, getCapabilitiesUrl);
        // await wmsTimeLayer.loadLayerTimes();
        // this.#timedimension?.setTimes(wmsTimeLayer.getTimes(), 'union');
        // wmsTimeLayer.addTo(sourceId, this.#map);
        // this.#layers.push(wmsTimeLayer); 

        // if (!this.#map || !this.#timedimension) return;
        // const wmsTimeLayer = new MaplibreglRasterTimeLayer(
        //     this.#timedimension,
        //     {
        //         sourceId: 'wms-test-source',
        //         layerId: 'omirl:tempMean',
        //         tileBaseUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows',
        //         tileUrlParams: {
        //             service: 'WMS',
        //             layers: 'omirl:tempMean',
        //             transparent: 'true',
        //             format: 'image/png',
        //             version: '1.1.1',
        //             request: 'GetMap',
        //             srs: 'EPSG:3857',
        //             width: '256',
        //             height: '256'
        //         },
        //         tileUrlTemplate: {
        //             bbox: '{bbox-epsg-3857}'
        //         },
        //         getCapabilitiesUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows?request=GetCapabilities&service=WMS&version=1.1.1'
        //     });
        // wmsTimeLayer.loadTimes()
        //     .then((times: number[] | undefined) => {
        //         if (times) {
        //             this.#timedimension?.setTimes(times, 'union');
        //             this.#timedimension?.lastTime();
        //         }
        //         console.log(this.#timedimension?.getTimes());
        //     });
        // wmsTimeLayer.addTo(this.#map);
        // this.#layers.push(wmsTimeLayer);

        if (!this.#map || !this.#delorean) return;
        const wmsTimeLayer = new MaplibreglRasterTimeLayer(this.#delorean, options);
        await wmsTimeLayer.addTo(this.#map);
        this.#layers.push(wmsTimeLayer);
    }

    public removeWmsTimeLayer(layerId: string) {
        // const foundLayer = this.#layers.find((l: Object): l is MaplibreglWmsTimeLayer => l instanceof MaplibreglWmsTimeLayer && l.getLayerId() === layerId);
        // if (!this.#map || !foundLayer) return;
        // foundLayer.removeFrom(sourceId, layerId, this.#map);
        // this.#timedimension?.removeTimes(foundLayer.getTimes());

        // const foundLayer = this.#layers.find((l: Object): l is MaplibreglRasterTimeLayer => l instanceof MaplibreglRasterTimeLayer && l.layerId === layerId);
        // if (!this.#map || !foundLayer) return;
        // foundLayer.removeFrom(this.#map);
        // this.#timedimension?.removeTimes([...foundLayer.times ?? []]);

        const foundLayer = this.#layers.find((l: Object): l is MaplibreglRasterTimeLayer => l instanceof MaplibreglRasterTimeLayer && l.layerId === layerId);
        if (!this.#map || !foundLayer) return;
        foundLayer.removeFrom(this.#map);
    }
}

customElements.define('app-maplibre', Maplibre)