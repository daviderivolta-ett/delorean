/* Types */
import type { LayerTimeInfo } from './delorean.types'

/* Utils */
export function getCurrentTimeIndex(time: number, times: number[]): number {
    let a = -1;

    if (time > times[times.length - 1]) return times.length - 1;

    for (let i = 0; i < times.length; i++) {
        const element = times[i];
        if (time < element) {
            a = i - 1;
            break;
        }
        if (time === element) {
            a = i;
            break;
        }
    }

    return a === -1 ? 0 : a;
}

/**
 * Scarica il GetCapabilities come testo XML.
 * @param baseUrl endpoint del GeoServer, es. "https://mio-server/geoserver/wms"
 * @param version versione WMS (default 1.3.0)
 */
async function fetchCapabilitiesXml(baseUrl: string, version: string = "1.3.0"): Promise<string> {
    const url = new URL(baseUrl);
    url.searchParams.set("SERVICE", "WMS");
    url.searchParams.set("REQUEST", "GetCapabilities");
    url.searchParams.set("VERSION", version);

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(
            `GetCapabilities fallita: HTTP ${res.status} ${res.statusText}`
        );
    }
    return res.text();
}

function parseXml(xmlText: string): Document {
    // In ambiente browser DOMParser è globale.
    // In Node, se non disponibile, va importato un polyfill (vedi nota in fondo).
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");

    const parserError = doc.getElementsByTagName("parsererror")[0];
    if (parserError) {
        throw new Error("Errore nel parsing dell'XML: " + parserError.textContent);
    }
    return doc;
}

/**
 * I layer WMS in GetCapabilities sono annidati (Layer dentro Layer).
 * Cerchiamo ricorsivamente l'elemento <Layer> il cui <Name> combacia
 * con l'id/nome cercato (es. "workspace:layername").
 */
function findLayerElementByName(root: Element, layerName: string): Element | null {
    // getElementsByTagName ignora i prefissi di namespace (wms:Layer -> "Layer")
    const layers = Array.from(root.getElementsByTagName("Layer"));

    for (const layer of layers) {
        // prendiamo solo il <Name> figlio diretto di QUESTO layer
        const nameEl = Array.from(layer.children).find(
            (c) => c.tagName === "Name" || c.tagName.endsWith(":Name")
        );
        if (nameEl && nameEl.textContent?.trim() === layerName) {
            return layer;
        }
    }
    return null;
}

/**
 * Cerca l'elemento <Dimension name="time"> dentro il layer trovato.
 * Nota: in WMS 1.3.0 il valore è nel testo dell'elemento; in 1.1.1
 * può comparire anche come <Extent name="time">.
 */
function findTimeDimensionElement(layerEl: Element): Element | null {
    const candidates = Array.from(
        layerEl.getElementsByTagName("Dimension")
    ).concat(Array.from(layerEl.getElementsByTagName("Extent")));

    return (
        candidates.find(
            (el) => el.getAttribute("name")?.toLowerCase() === "time"
        ) ?? null
    );
}

/**
 * Il contenuto testuale della dimensione time può essere:
 *  a) una lista di date separate da virgola:
 *     "2023-01-01T00:00:00Z,2023-01-02T00:00:00Z,2023-01-03T00:00:00Z"
 *  b) un intervallo con eventuale periodo:
 *     "2023-01-01T00:00:00Z/2023-12-31T00:00:00Z/P1D"
 *  c) una combinazione di più intervalli/valori separati da virgola
 */
function parseTimeExtentValue(raw: string): number[] {
    const cleaned = raw.trim();

    if (cleaned.includes("/")) {
        // formato intervallo: start/end[/period]
        return []
    }

    // formato lista di valori discreti
    const values = cleaned
        .split(",")
        .map((v) => new Date(v.trim()).getTime())
        .filter(Boolean);

    return values;
}

/**
 * Funzione end-to-end: dato l'URL base del GeoServer e l'id/nome del layer,
 * restituisce le informazioni temporali del layer.
 *
 * @param geoserverBaseUrl es. "https://mio-server/geoserver/wms"
 * @param layerId es. "mio_workspace:mio_layer"
 */
export async function getLayerTimes(geoserverBaseUrl: string, layerId: string): Promise<LayerTimeInfo> {
    // 1. fetch XML
    const xmlText = await fetchCapabilitiesXml(geoserverBaseUrl);

    // 2. parse in DOM
    const doc = parseXml(xmlText);

    // 3. trova il layer
    const layerEl = findLayerElementByName(doc.documentElement, layerId);
    if (!layerEl) {
        throw new Error(`Layer "${layerId}" non trovato nel GetCapabilities`);
    }

    // 4. trova la dimensione time
    const dimEl = findTimeDimensionElement(layerEl);
    if (!dimEl) {
        throw new Error(`Il layer "${layerId}" non espone una dimensione "time"`);
    }

    const raw = dimEl.textContent?.trim() ?? "";
    const defaultValue = dimEl.hasAttribute('default') ?
        new Date(dimEl.getAttribute('default')!).getTime() :
        undefined;

    // 5. parse del valore
    const discreteValues = parseTimeExtentValue(raw);

    return {
        defaultValue,
        discreteValues
    };
}