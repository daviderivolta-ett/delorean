/* Types */
import type { TimesOperation } from '../types'

/* Class */
export class Timedimension {
    #times: number[];
    #requestedTime: number;
    #currentTimeIndex: number;
    #timeChangedCallbacks: Function[] = [];

    constructor(defaultTimes: number[] = [], defaultCurrentTime: number = new Date().getTime()) {
        this.#times = [...defaultTimes].toSorted((a, b) => a - b);
        this.#requestedTime = defaultCurrentTime;
        this.#currentTimeIndex = this.#getCurrentTimeIndex(this.#requestedTime, this.#times);        
    }

    public getTimes() {
        return [...this.#times];
    }

    public setTimes(newTimes: number[], operation: TimesOperation = 'intersect') {
        switch (operation) {
            case 'union':
                this.#times = [...this.#times, ...newTimes].toSorted((a, b) => a - b);
                break;
            case 'intersect':
                this.#times = [...new Set([...this.#times, ...newTimes].toSorted((a, b) => a - b))];
                break;
            default:
                this.#times = [...newTimes];
                break;
        }
    }

    public removeTimes(timesToRemove: number[]) {
        this.#times = this.#times.filter((t: number) => !timesToRemove.includes(t));
    }

    public getRequestedTime() {
        return this.#requestedTime;
    }

    public setRequestedTime(time: number) {
        this.#requestedTime = time;
        this.#currentTimeIndex = this.#getCurrentTimeIndex(time, this.#times);
        this.timeChanged(this.getCurrentTime());
    }

    public getCurrentTime() {
        return this.#times[this.#currentTimeIndex];
    }

    public prevTime(loop: boolean = true) {
        this.#currentTimeIndex--;
        if (loop) {
            if (this.#currentTimeIndex < 0) this.#currentTimeIndex = this.#times.length - 1;
            if (this.#currentTimeIndex > this.#times.length - 1) this.#currentTimeIndex = 0;
        } else {
            if (this.#currentTimeIndex < 0) this.#currentTimeIndex = 0;
            if (this.#currentTimeIndex > this.#times.length - 1) this.#currentTimeIndex = this.#times.length - 1;
        }
        this.timeChanged(this.getCurrentTime());
    }

    public nextTime(loop: boolean = true) {
        this.#currentTimeIndex++;
        if (loop) {
            if (this.#currentTimeIndex < 0) this.#currentTimeIndex = this.#times.length - 1;
            if (this.#currentTimeIndex > this.#times.length - 1) this.#currentTimeIndex = 0;
        } else {
            if (this.#currentTimeIndex < 0) this.#currentTimeIndex = 0;
            if (this.#currentTimeIndex > this.#times.length - 1) this.#currentTimeIndex = this.#times.length - 1;
        }
        this.timeChanged(this.getCurrentTime());
    }

    public firstTime() {
        this.#currentTimeIndex = 0;
        this.timeChanged(this.getCurrentTime());
    }

    public lastTime() {
        this.#currentTimeIndex = this.#times.length - 1;
        this.timeChanged(this.getCurrentTime());
    }

    public addTimeChangedListener(callback: (newTime: number) => void) {
        this.#timeChangedCallbacks.push(callback);
    }

    public timeChanged(newTime: number) {
        this.#timeChangedCallbacks.forEach((c) => c(newTime));
    }

    #getCurrentTimeIndex(time: number, times: number[]): number {
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
}