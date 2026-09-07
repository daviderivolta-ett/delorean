/* Services */
import type { TimesOperation } from './delorean.types';
import { getCurrentTimeIndex } from './delorean.utils'

/* Store */
export class Delorean {
    #times: number[];
    #currentTimeIndex: number;
    #callbacks: ((newTime: number) => void)[] = [];
    // #intervalId?: number;
    #isPlaying: boolean = false;

    constructor(defaultTimes: number[] = [], defaultCurrentTime: number = new Date().getTime()) {
        this.#times = [...defaultTimes].toSorted((a, b) => a - b);
        this.#currentTimeIndex = getCurrentTimeIndex(defaultCurrentTime, defaultTimes);
    }

    public get times(): number[] {
        return this.#times;
    }

    public get currentTime(): number {
        return this.#times[this.#currentTimeIndex];
    }

    public setTimes(newTimes: number[], operation: TimesOperation = 'intersect'): void {
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

    public setCurrentTime(time: number): void {
        this.#currentTimeIndex = getCurrentTimeIndex(time, this.#times);
        this.timeChanged(this.currentTime);
    }

    public removeTimes(timesToRemove: number[]) {
        this.#times = this.#times.filter((t: number) => !timesToRemove.includes(t));
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
        this.timeChanged(this.currentTime);
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
        this.timeChanged(this.currentTime);
    }

    public firstTime() {
        this.#currentTimeIndex = 0;
        this.timeChanged(this.currentTime);
    }

    public lastTime() {
        this.#currentTimeIndex = this.#times.length - 1;
        this.timeChanged(this.currentTime);
    }

    public togglePlay(isPlaying: boolean, interval: number = 3000): void {
        // if (!isPlaying) clearInterval(this.#intervalId);
        // else this.#intervalId = setInterval(() => this.nextTime(false), interval);
        this.#isPlaying = isPlaying;
        this.#loop(() => this.nextTime(), interval);
    }

    public addTimeChangedCallback(callback: (newTime: number) => void): void {
        this.#callbacks.push(callback);
    }

    public removeTimeChangedCallback(callback: (newTime: number) => void): void {
        this.#callbacks = this.#callbacks.filter(cb => cb !== callback);
    }

    public timeChanged(newTime: number): void {
        this.#callbacks.forEach((c) => c(newTime));
    }

    async #loop(callback: Function, ms: number) {
        while (this.#isPlaying) {
            await callback();
            if (!this.#isPlaying) break;
            await this.#sleep(ms);
        }
    }

    #sleep(ms: number) {
        return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }
}