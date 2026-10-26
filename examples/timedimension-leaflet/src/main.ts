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