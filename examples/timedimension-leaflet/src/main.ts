import './style.css'
import './leaflet'

import type { Leaflet } from './leaflet';

main();

function main() {
    const leaflet = document.querySelector('#maplibre') as Leaflet;
    const addBtn = document.querySelector('#add-layer') as HTMLButtonElement;
    const removeBtn = document.querySelector('#remove-layer') as HTMLButtonElement;

    addBtn.onclick = () => leaflet.addWmsTimeLayer(
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

    removeBtn.onclick = () => leaflet.removeWmsTimeLayer('omirl:tempMean');
}