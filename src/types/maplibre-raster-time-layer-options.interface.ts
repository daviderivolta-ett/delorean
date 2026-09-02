export interface MaplibreglRasterTimeLayerOptions {
    sourceId: string;
    layerId: string;
    tileBaseUrl: string;
    tileUrlParams: Record<string, string>;
    tileUrlTemplate: Record<string, string>;
    paint?: maplibregl.RasterLayerSpecification['paint'];
    getCapabilitiesUrl?: string;
}