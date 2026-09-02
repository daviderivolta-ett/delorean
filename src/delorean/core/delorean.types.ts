export type TimesOperation = 'union' | 'intersect' | 'replace';

export interface LayerTimeInfo {
    defaultValue?: number;
    discreteValues?: number[];
}