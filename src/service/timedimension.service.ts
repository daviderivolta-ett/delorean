export interface TimeInterval {
    start: string;
    end: string;
    period?: string; // es. "P1D", "PT1H", ecc. (opzionale)
}

export interface LayerTimeInfo {
    // layerName: string;
    defaultValue?: number;
    /** Valori discreti se la dimensione è espressa come lista */
    discreteValues?: number[];
    /** Intervallo se la dimensione è espressa come range start/end/period */
    // interval?: TimeInterval;
    /** Stringa raw non parsata, utile per debug */
    // raw: string;
}

// -----------------------------------------------------------------------
// 1. RECUPERO DEL DOCUMENTO GetCapabilities
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// 2. PARSING XML -> DOM
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// 3. RICERCA RICORSIVA DEL LAYER PER NOME
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// 4. ESTRAZIONE DELLA DIMENSIONE "time"
// -----------------------------------------------------------------------

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

// -----------------------------------------------------------------------
// 5. PARSING DEL VALORE DELLA DIMENSIONE
// -----------------------------------------------------------------------

/**
 * Il contenuto testuale della dimensione time può essere:
 *  a) una lista di date separate da virgola:
 *     "2023-01-01T00:00:00Z,2023-01-02T00:00:00Z,2023-01-03T00:00:00Z"
 *  b) un intervallo con eventuale periodo:
 *     "2023-01-01T00:00:00Z/2023-12-31T00:00:00Z/P1D"
 *  c) una combinazione di più intervalli/valori separati da virgola
 */
function parseTimeExtentValue(raw: string): { discreteValues?: number[]; interval?: TimeInterval } {
    const cleaned = raw.trim();

    if (cleaned.includes("/")) {
        // formato intervallo: start/end[/period]
        const parts = cleaned.split(",")[0].split("/"); // gestiamo il primo intervallo
        const [start, end, period] = parts;
        return {
            interval: { start, end, period: period || undefined },
        };
    }

    // formato lista di valori discreti
    const values = cleaned
        .split(",")
        .map((v) => new Date(v.trim()).getTime())
        .filter(Boolean);

    return { discreteValues: values };
}

// -----------------------------------------------------------------------
// 6. FUNZIONE PRINCIPALE
// -----------------------------------------------------------------------

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
    const { discreteValues, interval } = parseTimeExtentValue(raw);

    return {
        // layerName: layerId,
        defaultValue,
        discreteValues,
        // interval,
        // raw,
    };
}