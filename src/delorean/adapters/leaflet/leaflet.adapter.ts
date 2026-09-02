/* Dependencies */
import * as leaflet from 'leaflet'

/* Types */
import type { Delorean, LayerTimeInfo, TimesOperation } from '../../core'
import type { LeafletRasterTimeLayerOptions } from './leaflet.options'

/* Utils */
import { getLayerTimes } from '../../core'

/* Class */
export class LeafletRasterTimeLayer {
    readonly layerId: string;
    readonly layer: leaflet.Layer;
    readonly getCapabilitiesUrl?: string;

    #delorean: Delorean;
    #tileBaseUrl: string;
    #wmsOptions: leaflet.WMSOptions;
    #times?: number[];

    #timeChangedCallback?: (newTime: number) => void;

    constructor(delorean: Delorean, options: LeafletRasterTimeLayerOptions) {
        this.#delorean = delorean;
        this.layerId = options.layerId;
        this.getCapabilitiesUrl = options.getCapabilitiesUrl;

        this.#tileBaseUrl = options.tileBaseUrl;
        this.#wmsOptions = options.wmsOptions;

        this.layer = leaflet.tileLayer.wms(this.#tileBaseUrl, this.#wmsOptions);
    }

    public async addTo(map: leaflet.Map, defaultTime?: number, operation: TimesOperation = 'intersect') {
        const timeInfo: LayerTimeInfo = await this.loadTimes();
        map.addLayer(this.layer);
        this.#times = timeInfo.discreteValues;
        this.#delorean.setTimes(this.#times ?? [], operation);
        if (defaultTime) this.setTime(defaultTime);
        defaultTime ? this.#delorean.setCurrentTime(defaultTime) : this.#delorean.lastTime();
        this.#timeChangedCallback = (newTime: number) => this.setTime(newTime);
        this.#delorean.addTimeChangedCallback(this.#timeChangedCallback);
        return this;
    }

    public removeFrom(map: leaflet.Map): this {
        map.removeLayer(this.layer);
        this.#delorean.removeTimes(this.#times ?? []);
        if (this.#timeChangedCallback) this.#delorean.removeTimeChangedCallback(this.#timeChangedCallback);
        return this;
    }

    public loadTimes(): Promise<LayerTimeInfo> {
        if (!this.getCapabilitiesUrl) throw new Error(`getCapabilitiesUrl undefined`);
        return getLayerTimes(this.getCapabilitiesUrl, this.layerId);
    }

    public setTime(time: number): this {
        (this.layer as leaflet.TileLayer.WMS).setParams({
            time: `${new Date(time).toISOString()}`
        } as unknown as leaflet.WMSParams)
        return this;
    }
}