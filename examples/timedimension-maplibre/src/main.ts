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