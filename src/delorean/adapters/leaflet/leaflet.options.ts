/* Dependencies */
import * as leaflet from 'leaflet'

/* Interface */
export interface LeafletRasterTimeLayerOptions {
    layerId: string;
    tileBaseUrl: string;
    wmsOptions: leaflet.WMSOptions;
    getCapabilitiesUrl?: string;
}