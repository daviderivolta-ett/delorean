/* Dependencies */
import maplibregl from 'maplibre-gl'

/* Types */
import type { Delorean, LayerTimeInfo, TimesOperation } from '../../core'
import type { MaplibreglRasterTimeLayerOptions } from './maplibregl.options'

/* Utils */
import { getLayerTimes } from '../../core'

/* Class */
export class MaplibreglRasterTimeLayer {
    readonly sourceId: string;
    readonly source: maplibregl.RasterSourceSpecification;
    readonly layerId: string;
    readonly layer: maplibregl.RasterLayerSpecification;
    readonly getCapabilitiesUrl?: string;

    #delorean: Delorean;
    #tileBaseUrl: string;
    #tileUrlParams: URLSearchParams;
    #tileUrlTemplate: Record<string, string>;
    #times?: number[];

    #timeChangedCallback?: (newTime: number) => void;

    constructor(delorean: Delorean, options: MaplibreglRasterTimeLayerOptions) {
        this.#delorean = delorean;
        this.sourceId = options.sourceId;
        this.layerId = options.layerId;
        this.getCapabilitiesUrl = options.getCapabilitiesUrl;

        this.#tileBaseUrl = options.tileBaseUrl;
        this.#tileUrlParams = new URLSearchParams(options.tileUrlParams);
        this.#tileUrlTemplate = options.tileUrlTemplate;

        this.source = this.#createSource();
        this.layer = this.#createLayer(options.paint);
    }

    public async addTo(map: maplibregl.Map, defaultTime?: number, operation: TimesOperation = 'intersect'): Promise<this> {
        const timeInfo: LayerTimeInfo = await this.loadTimes();
        map.addSource(this.sourceId, this.source);
        map.addLayer(this.layer);
        this.#times = timeInfo.discreteValues;
        this.#delorean.setTimes(this.#times ?? [], operation);
        if (defaultTime) this.setTime(map, defaultTime);
        defaultTime ? this.#delorean.setCurrentTime(defaultTime) : this.#delorean.lastTime();
        this.#timeChangedCallback = (newTime: number) => this.setTime(map, newTime);
        this.#delorean.addTimeChangedCallback(this.#timeChangedCallback);
        await new Promise((resolve) => map.once('idle', resolve));
        return this;
    }

    public removeFrom(map: maplibregl.Map): this {
        if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
        if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
        this.#delorean.removeTimes(this.#times ?? []);
        if (this.#timeChangedCallback) this.#delorean.removeTimeChangedCallback(this.#timeChangedCallback);
        return this;
    }

    public loadTimes(): Promise<LayerTimeInfo> {
        if (!this.getCapabilitiesUrl) throw new Error(`getCapabilitiesUrl undefined`);
        return getLayerTimes(this.getCapabilitiesUrl, this.layerId);
    }

    public async setTime(map: maplibregl.Map, time: number): Promise<this> {
        if (!map) throw new Error(`Cannot set time: layer "${this.layerId}" is not attached to a map.`);

        const loaded = new Promise<void>((resolve) => {
            map.once('idle', () => resolve());
        });

        const source = map.getSource(this.sourceId);
        if (!source || source.type !== 'raster') throw new Error(`Raster source "${this.sourceId}" not found.`);

        this.#tileUrlParams.set('TIME', `${new Date(time).toISOString()}`);
        if (source instanceof maplibregl.RasterTileSource) source.setTiles([this.#buildTileUrl()]);

        await loaded;

        return this;
    }

    #createSource(): maplibregl.RasterSourceSpecification {
        return {
            type: 'raster',
            tiles: [this.#buildTileUrl()]
        };
    }

    #createLayer(paint?: maplibregl.RasterLayerSpecification['paint']): maplibregl.RasterLayerSpecification {
        return {
            id: this.layerId,
            source: this.sourceId,
            type: 'raster',
            paint: paint ?? {}
        };
    }

    #buildTileUrl(): string {
        return `${this.#tileBaseUrl}?${this.#tileUrlParams.toString()}&${Object.entries(this.#tileUrlTemplate).map(([k, v]) => `${k}=${v}`).join('&')}`;
    }
}