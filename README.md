# Delorean

Aggiunge possibilità di gestione dei tempi di layer raster WMS a framework di mappe multipli, come Leaflet e Maplibre.



## Examples and basic usage

### Leaflet example

```html
<!-- index.html -->

<html>
    <head>
        <title>Delorean Leaflet example</title>
    </head>
    <body>
        <button type="button" id="add-layer" class="add-layer-btn">ADD WMS LAYER</button>
        <button type="button" id="remove-layer" class="remove-layer-btn">REMOVE WMS LAYER</button>
        <app-leaflet id="maplibre"></app-leaflet>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```

```ts
// main.ts

/* Dependencies */
import './style.css'
import './leaflet'

/* Types */
import type { Leaflet } from './leaflet'

/* Methods */
main();

function main() {
    /**
     * Connect simple ui
     */
    const leaflet = document.querySelector('#maplibre') as Leaflet;
    const addBtn = document.querySelector('#add-layer') as HTMLButtonElement;
    const removeBtn = document.querySelector('#remove-layer') as HTMLButtonElement;

    /**
     * Add layer to Leaflet map instance
     */
    addBtn.onclick = () => leaflet.addWmsTimeLayer(
        /**
         * LeafletRasterTimeLayerOptions object
         */
        {
            layerId: 'omirl:tempMean',
            tileBaseUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows',
            wmsOptions: {
                layers: 'omirl:tempMean',
                format: 'image/png',
                transparent: true,
                version: '1.1.1'
            },
            getCapabilitiesUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows?request=GetCapabilities&service=WMS&version=1.1.1'
        }
    );

    /**
     * Remove layer from Leaflet map instance
     */
    removeBtn.onclick = () => leaflet.removeWmsTimeLayer('omirl:tempMean');
}
```

```ts
// leaflet.ts

/* Dependencies */
import * as leaflet from 'leaflet'
import style from 'leaflet/dist/leaflet.css?raw'

/* Types */
import type { LeafletRasterTimeLayerOptions } from 'delorean'

/* Classes */
import { Delorean, LeafletRasterTimeLayer } from 'delorean'

/* Components */
import { DeloreanController } from 'delorean'

/* Class */
export class Leaflet extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: leaflet.Map;
    /**
     * Delorean instance
    */
    #delorean?: Delorean;
    /**
     * Delorean controller instance
    */
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
        this.#deloreanController = this.shadowRoot.querySelector('#delorean') as DeloreanController;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="leaflet" class="leaflet"></div>
            <delorean-controller id="delorean" class="delorean"></delorean-controller>
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

            .delorean {
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
         * Connect Delorean controller ui events to Delorean store class callbacks
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
         * Remove Leaflet raster layer wrapper
         * from Leaflet instance map
         */
        foundLayer.removeFrom(this.#map);
        this.#layers = this.#layers.filter((l) => l instanceof LeafletRasterTimeLayer && l.layerId !== foundLayer.layerId);
    }
}

customElements.define('app-leaflet', Leaflet);
```


### Maplibre example

```html
<!-- index.html -->

<html>
    <head>
        <title>Delorean Maplibre example</title>
    </head>
    <body>
        <button type="button" id="add-layer" class="add-layer-btn">ADD WMS LAYER</button>
        <button type="button" id="remove-layer" class="remove-layer-btn">REMOVE WMS LAYER</button>
        <app-maplibre id="maplibre"></app-maplibre>
        <script type="module" src="/src/main.ts"></script>
    </body>
</html>
```

```ts
// main.ts

/* Dependencies */
import './style.css'
import './maplibre'

/* Types */
import type { Maplibre } from './maplibre'

/* Methods */
main();

function main() {
    /**
     * Connect simple ui
     */
    const maplibre = document.querySelector('#maplibre') as Maplibre;
    const addBtn = document.querySelector('#add-layer') as HTMLButtonElement;
    const removeBtn = document.querySelector('#remove-layer') as HTMLButtonElement;

    /**
     * Add layer to Maplibre map instance
     */
    addBtn.onclick = () => maplibre.addWmsTimeLayer(
        /**
         * MaplibreRasterTimeLayerOptions object
         */
        {
            sourceId: 'wms-test-source',
            layerId: 'omirl:tempMean',
            tileBaseUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows',
            tileUrlParams: {
                service: 'WMS',
                layers: 'omirl:tempMean',
                transparent: 'true',
                format: 'image/png',
                version: '1.1.1',
                request: 'GetMap',
                srs: 'EPSG:3857',
                width: '256',
                height: '256'
            },
            tileUrlTemplate: {
                bbox: '{bbox-epsg-3857}'
            },
            getCapabilitiesUrl: 'https://omirl-dev-ett.cfmi.arpal.org/geoserver/ows?request=GetCapabilities&service=WMS&version=1.1.1'
        }
    );

    /**
     * Remove layer from Maplibre map instance
     */
    removeBtn.onclick = () => maplibre.removeWmsTimeLayer('omirl:tempMean');
}
```

```ts
// maplibre.ts

/* Dependencies */
import * as maplibregl from 'maplibre-gl'
import style from 'maplibre-gl/dist/maplibre-gl.css?raw'

/* Types */
import type { MaplibreglRasterTimeLayerOptions } from 'delorean'

/* Classes */
import { Delorean, MaplibreglRasterTimeLayer, DeloreanController } from 'delorean'

/* Class */
export class Maplibre extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #map?: maplibregl.Map;
    /**
     * Delorean instance
    */
    #delorean?: Delorean;
    /**
     * Delorean controller instance
    */
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

        /**
         * Get Delorean controller instance from Shadowroot
         */
        this.#deloreanController = this.shadowRoot.querySelector('#delorean') as DeloreanController;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div id="maplibre" class="maplibre"></div>
            <delorean-controller id="delorean" class="delorean"></delorean-controller>
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

            .delorean {
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
         * Connect Delorean controller ui events to Delorean store class callbacks
         */
        this.addEventListener('timedimension-firsttime', () => this.#delorean?.firstTime());
        this.addEventListener('timedimension-prevtime', () => this.#delorean?.prevTime());
        this.addEventListener('timedimension-nexttime', () => this.#delorean?.nextTime());
        this.addEventListener('timedimension-lasttime', () => this.#delorean?.lastTime());
        this.addEventListener('timedimension-play', (e: Event) => this.#delorean?.togglePlay((e as CustomEvent).detail, 1000));
    }

    public async addWmsTimeLayer(options: MaplibreglRasterTimeLayerOptions) {
        if (!this.#map || !this.#delorean) return;
        /**
         * Create Maplibre raster layer wrapper
         * and add to Maplibre map instance
         */
        const wmsTimeLayer = new MaplibreglRasterTimeLayer(this.#delorean, options);
        await wmsTimeLayer.addTo(this.#map);
        this.#layers.push(wmsTimeLayer);
    }

    public removeWmsTimeLayer(layerId: string) {
        const foundLayer = this.#layers.find((l: Object): l is MaplibreglRasterTimeLayer => l instanceof MaplibreglRasterTimeLayer && l.layerId === layerId);
        if (!this.#map || !foundLayer) return;
        /**
         * Remove Maplibre raster layer wrapper
         * from Maplibre instance map
         */
        foundLayer.removeFrom(this.#map);
                this.#layers = this.#layers.filter((l) => l instanceof MaplibreglRasterTimeLayer && l.layerId !== foundLayer.layerId);
    }
}

customElements.define('app-maplibre', Maplibre)
```

## Class

Il plugin è pensato per essere un gestore di tempi, utilizzabile sia con che senza il controller fornito dalla libreria. Il core del plugin è la classe Delorean, che espone alcuni metodi per la gestione di tempi.


### Creation

Metodo di creazione dell'istanza della class `Delorean`.

| Factory | Description |
| ------- | ----------- |
| `Delorean(defaultTimes: number[] = [], defaultCurrentTime: number = new Date().getTime())` | Crea un'istanza del core Delorean |


#### Options

Parametri del costruttore.

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| defaultTimes | `number[]` | `[]` | L'elenco dei tempi di cui il plugin deve tenere conto |
| defaultCurrentTime | `number` | `new Date().getTime()` | Il tempo attuale iniziale |


### Methods

Metodi esposti dall'istanza della classe `Delorean`.

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `setTimes(newTimes: number[], operation: TimesOperation = 'intersect')` | `void` | Aggiorna i tempi del core Delorean secondo la modalità descritta dal parametro `operation` |
| `setCurrentTime(time: number)` | `void` | Aggiorna il tempo corrente in maniera diretta |
| `removeTimes(timesToRemove: number[])` | `void` | Rimuove in maniera diretta i tempi passati alla funzione |
| `prevTime(loop: boolean = true)` | `void` | Passa al tempo precedente tra i disponibili. In base al parametro `loop` torna all'ultimo una volta arrivato al primo disponibile oppure no. |
| `nextTime(loop: boolean = true)` | `void` | Passa al tempo successivo tra i disponibili. In base al parametro `loop` torna al primo una volta arrivato all'ultimo disponibile oppure no. |
| `firstTime()` | `void` | Passa al primo tempo tra quelli disponibili |
| `lastTime()` | `void` | Passa all'ultimo tempo tra quelli disponibili |
| `togglePlay(isPlaying: boolean, interval: number = 3000)` | `void` | Attiva o disattiva il passaggio al tempo successivo. Il ritmo di passaggio da un tempo all'altro dipende dal parametro `interval` |
| `addTimeChangedCallback(callback: (newTime: number) => void)` | `void` | Callback da richiamare ogni volta che il tempo cambia | 
| `removeTimeChangedCallback(callback: (newTime: number) => void)` | `void` | Rimozione della callback | 
| `timeChanged(newTime: number)` | `void` | Richiama tutte le callback aggiunte al cambio di tempo corrente |


#### TimesOperation

Enum `TimesOperation` e relative valori disponibili.

| Values | Description |
| ------ | ----------- |
| `union` | Unisce i tempi forniti con quelli già presenti nell'istanza di Delorean |
| `intersect` | Interseca i tempi forniti con quelli già presenti nell'istanza di Delorean |
| `replace` | Sostituisce completamente i tempi forniti con quelli già presenti nell'istanza di Delorean |



## Adapters

Per usare la classe `Delorean` in maniera efficace con framework di mappe specifici esistono degli adapter, di fatto wrapper della classi rappresentanti layer raster WMS nello specifico framework.


### Leaflet

### Creation

Metodo di creazione dell'istanza della class `LeafletRasterTimeLayer`.

| Factory | Description |
| ------- | ----------- |
| `LeafletRasterTimeLayer(delorean: Delorean, options: LeafletRasterTimeLayerOptions` | Crea un'istanza della classe wrapper `LeafletRasterTimeLayer` |



#### Options

Parametri del costruttore

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| delorean | `Delorean` | - | Istanza della classe core `Delorean` |
| options | `LeafletRasterTimeLayerOptions` | - | Interface specifica per il costruttore: contiene molti dati del layer da passare a `Leaflet`. |


#### LeafletRasterTimeLayerOptions

Parametri dell`interface

| Parameter | Type | Optional | Description |
| --------- | ---- | -------- | ----------- |
| layerId | string | no | Identificativo univoco del layer |
| tileBaseUrl | string | no | Url del feoserver su cui sono hostati i tile della mappa |
| wmsOptions | leaflet.WMSOptions | no | Opzioni del layer raster WMS. Type specifico di Leaflet |
| getCapabilitiesUrl | string | yes | Url geoserver a cui fare richiesta GetCapabilities per ottenere i relativi tempi disponibili |


## Controller

La libreria offre un componente UI per la gestione dei tempi che può essere usato sia in combinazione con la classe Delorean che da solo.


### Methods

Il componente espone alcuni metodi grazie alla quale è possibile compiere alcune azioni.

| Method | Returns | Description |
| ------ | ------- | ----------- |
| `set time(value: number)` | void | Aggiorna il tempo attuale mostrato dall'`input` |

### Events

Il componente emette alcuni eventi ad ogni azione, che possono essere usati per collegare la class Delorean con il controller UI.

| Event | Data | Description |
| ----- | ---- | ----------- |
| `timedimension-firsttime` | `void` | Evento emesso quando si clicca sul pulsante per andare al primo tempo |
| `timedimension-lasttime` | `void` | Evento emesso quando si clicca sul pulsante per andare all'ultimo tempo |
| `timedimension-prevtime` | `void` | Evento emesso quando si clicca sul pulsante per andare al tempo precedente |
| `timedimension-nexttime` | `void` | Evento emesso quando si clicca sul pulsante per andare al tempo successivo |
| `timedimension-play` | `{ detail: boolean }` | Evento emesso quando si clicca sul pulsante per il trigger del play/pausa. La proprietà `detail` emessa mostra se il componente è in modalità `play` oppure no. |


### Style

Il controller è stylabile dall'esterno grazie allo pseudo-elemento `::part()` in ogni sua parte.

| Part | Element | Attribute | Description |
| ---- | ------- | --------- | ----------- |
| `delorean` | `div` | - | Wrapper esterno |
| `delorean__first` | `button` | `type="button"` | Pulsante per tornare al primo dei tempi disponibili |
| `delorean__previous` | `button` | `type="button"` | Pulsante per tornare al tempo precedente |
| `delorean__play` | `button` | `type="button"` | Pulsante che triggera lo status `play`/`pause` |
| `delorean__next` | `button` | `type="button"` | Pulsante per andare al tempo successivo |
| `delorean__last` | `button` | `type="button"` | Pulsante per andare all'ultimo dei tempi disponibili |
| `delorean__datetime` | `input` | `type="datetime-local"`, `readonly` | Input che mostra la data attuale (se passata al componente tramite il setter `set time(value: number)`) |


#### Example
```html
<delorean-controller class="delorean" />
```

```css
.delorean::part(delorean) {
    flex-direction: column;
}

.delorean::part(delorean__first) {
    background-color: red;
}
```