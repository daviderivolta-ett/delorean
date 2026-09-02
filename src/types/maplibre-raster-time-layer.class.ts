/* Dependencies */
import maplibregl from 'maplibre-gl'

/* Types */
import type { MaplibreglRasterTimeLayerOptions } from './maplibre-raster-time-layer-options.interface'

/* Services */
import { getLayerTimes, Timedimension } from '../service'

/* Class */
export class MaplibreglRasterTimeLayer {
    readonly sourceId: string;
    readonly source: maplibregl.RasterSourceSpecification;
    readonly layerId: string;
    readonly layer: maplibregl.RasterLayerSpecification;
    readonly getCapabilitiesUrl?: string;
    
    #timedimension: Timedimension;
    #tileBaseUrl: string;
    #tileUrlParams: URLSearchParams;
    #tileUrlTemplate: Record<string, string>;
    #times?: number[];

    constructor(timedimension: Timedimension, options: MaplibreglRasterTimeLayerOptions) {
        this.#timedimension = timedimension;

        this.sourceId = options.sourceId;
        this.layerId = options.layerId;
        this.getCapabilitiesUrl = options.getCapabilitiesUrl;

        this.#tileBaseUrl = options.tileBaseUrl;
        this.#tileUrlParams = new URLSearchParams(options.tileUrlParams);
        this.#tileUrlTemplate = options.tileUrlTemplate;

        this.source = this.#createSource();
        this.layer = this.#createLayer(options.paint);
    }

    public get times(): readonly number[] | undefined { return this.#times }

    public addTo(map: maplibregl.Map): this {
        map.addSource(this.sourceId, this.source);
        map.addLayer(this.layer);

        return this;
    }

    public removeFrom(map: maplibregl.Map): this {
        if (map.getLayer(this.layerId)) {
            map.removeLayer(this.layerId);
        }

        if (map.getSource(this.sourceId)) {
            map.removeSource(this.sourceId);
        }

        return this;
    }

    public loadTimes(): Promise<number[] | undefined> {
        if (!this.getCapabilitiesUrl) throw new Error(`getCapabilitiesUrl undefined`);

        return getLayerTimes(this.getCapabilitiesUrl, this.layerId)
            .then(({ defaultValue: _, discreteValues }) => {
                this.#times = discreteValues && [...discreteValues];
                return this.#times;
            })
    }

    public setTime(map: maplibregl.Map, time: number): this {
        if (!map) {
            throw new Error(
                `Cannot set time: layer "${this.layerId}" is not attached to a map`
            );
        }

        const source = map.getSource(this.sourceId);

        if (!source || source.type !== 'raster') {
            throw new Error(
                `Raster source "${this.sourceId}" not found`
            );
        }

        this.#tileUrlParams.set('TIME', `${new Date(time).toISOString()}`);

        if (source instanceof maplibregl.RasterTileSource) {
            source.setTiles([this.#buildTileUrl()]);
        }

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