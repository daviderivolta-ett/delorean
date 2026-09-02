export class TimedimensionComponent extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #isPlaying: boolean = false;

    #datetimeInput: HTMLInputElement;
    #firstBtn: HTMLButtonElement;
    #prevBtn: HTMLButtonElement;
    #nextBtn: HTMLButtonElement;
    #lastBtn: HTMLButtonElement;
    #playBtn: HTMLButtonElement;

    constructor() {
        super();
        this.shadowRoot = this.attachShadow({ mode: 'open' });

        this.shadowRoot.appendChild(this.#html().content.cloneNode(true));
        this.shadowRoot.appendChild(this.#css().cloneNode(true));

        this.#datetimeInput = this.shadowRoot.querySelector('#datetime') as HTMLInputElement;
        this.#firstBtn = this.shadowRoot.querySelector('#first') as HTMLButtonElement;
        this.#prevBtn = this.shadowRoot.querySelector('#prev') as HTMLButtonElement;
        this.#nextBtn = this.shadowRoot.querySelector('#next') as HTMLButtonElement;
        this.#lastBtn = this.shadowRoot.querySelector('#last') as HTMLButtonElement;
        this.#playBtn = this.shadowRoot.querySelector('#play') as HTMLButtonElement;
    }

    #html(): HTMLTemplateElement {
        const template = document.createElement('template');
        template.innerHTML =
            `
            <div class="timedimension">
                <button type="button" id="first">F</button>
                <button type="button" id="prev">P</button>
                <button type="button" id="play">Play/Pause</button>
                <button type="button" id="next">F</button>
                <button type="button" id="last">L</button>
                <input type="datetime-local" id="datetime" />
            </div>
        `;
        return template;
    }

    #css(): HTMLStyleElement {
        const style = document.createElement('style');
        style.innerHTML =
            `
            .timedimension {
                display: flex;
                align-items: center;
            }
            `
            ;
        return style;
    }

    public connectedCallback(): void {
        this.#setup();
    }

    public set time(value: number) {
        this.#datetimeInput.value = this.#toDatetimeLocal(value);
    }

    #setup(): void {
        this.#firstBtn.onclick = this.#onFirstBtnClick;
        this.#prevBtn.onclick = this.#onPrevBtnClick;
        this.#nextBtn.onclick = this.#onNextBtnClick;
        this.#lastBtn.onclick = this.#onLastBtnClick;
        this.#playBtn.onclick = this.#onPlayBtnClick;
    }

    #onFirstBtnClick = () => {
        this.dispatchEvent(
            new CustomEvent('timedimension-firsttime', { bubbles: true, composed: true })
        );
    }

    #onPrevBtnClick = () => {
        this.dispatchEvent(
            new CustomEvent('timedimension-prevtime', { bubbles: true, composed: true })
        );
    }

    #onNextBtnClick = () => {
        this.dispatchEvent(
            new CustomEvent('timedimension-nexttime', { bubbles: true, composed: true })
        );
    }

    #onLastBtnClick = () => {
        this.dispatchEvent(
            new CustomEvent('timedimension-lasttime', { bubbles: true, composed: true })
        );
    }

    #onPlayBtnClick = () => {
        this.#isPlaying = !this.#isPlaying;
        this.dispatchEvent(
            new CustomEvent('timedimension-play', { bubbles: true, composed: true, detail: this.#isPlaying })
        )
    }

    #toDatetimeLocal(time: number): string {
        const date = new Date(time);

        const pad = (value: number) => value.toString().padStart(2, '0');

        return [
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
            `${pad(date.getHours())}:${pad(date.getMinutes())}`
        ].join('T');
    }
}

customElements.define('app-timedimension', TimedimensionComponent)