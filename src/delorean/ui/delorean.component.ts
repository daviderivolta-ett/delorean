export class DeloreanController extends HTMLElement {
    public shadowRoot: ShadowRoot;

    #isPlaying: boolean = false;

    #datetimeInput: HTMLInputElement;
    #firstBtn: HTMLButtonElement;
    #prevBtn: HTMLButtonElement;
    #nextBtn: HTMLButtonElement;
    #lastBtn: HTMLButtonElement;
    #playBtn: HTMLButtonElement;

    #playIcon: string = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M560-200v-560h160v560H560Zm-320%200v-560h160v560H240Z%22%2F%3E%3C%2Fsvg%3E';
    #pauseIcon: string = 'data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M320-200v-560l440%20280-440%20280Z%22%2F%3E%3C%2Fsvg%3E';

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
            <div part="delorean" class="delorean">
                <button type="button" part="delorean__first" id="first" class="delorean-btn">
                    <span class="delorean-btn__icon" style="mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M220-240v-480h80v480h-80Zm520%200L380-480l360-240v480Z%22%2F%3E%3C%2Fsvg%3E')"></span>
                </button>
                <button type="button" part="delorean__previous" id="prev" class="delorean-btn">
                    <span class="delorean-btn__icon" style="mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M860-240%20500-480l360-240v480Zm-400%200L100-480l360-240v480Z%22%2F%3E%3C%2Fsvg%3E')"></span>
                </button>
                <button type="button" part="delorean__play" id="play" class="delorean-btn">
                    <span class="delorean-btn__icon" style="mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M320-200v-560l440%20280-440%20280Z%22%2F%3E%3C%2Fsvg%3E')"></span>
                </button>
                <button type="button" part="delorean__next" id="next" class="delorean-btn">
                    <span class="delorean-btn__icon" style="mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M100-240v-480l360%20240-360%20240Zm400%200v-480l360%20240-360%20240Z%22%2F%3E%3C%2Fsvg%3E')"></span>
                </button>
                <button type="button" part="delorean__last" id="last" class="delorean-btn">
                    <span class="delorean-btn__icon" style="mask-image: url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20height%3D%2224px%22%20viewBox%3D%220%20-960%20960%20960%22%20width%3D%2224px%22%20fill%3D%22%23000000%22%3E%3Cpath%20d%3D%22M660-240v-480h80v480h-80Zm-440%200v-480l360%20240-360%20240Z%22%2F%3E%3C%2Fsvg%3E')"></span>
                </button>
                <input type="datetime-local" part="delorean__datetime" id="datetime" class="delorean__datetime" disabled />
            </div>
        `;
        return template;
    }

    #css(): HTMLStyleElement {
        const style = document.createElement('style');
        style.innerHTML =
            `
            .delorean {
                display: flex;
                align-items: center;
            }

            .delorean-btn {
                width: 24px;
                height: 24px;
                margin: 0;
                padding: 0;
            }

            .delorean-btn,
            .delorean-btn__icon {
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .delorean-btn__icon {
                background-color: black;
                mask-repeat: no-repeat;
                mask-position: center;
                mask-size: contain;
                height: 100%;
                width: 100%;
            }

            .delorean__datetime {
                height: 24px;
            }
                
            .delorean__datetime:disabled {
                background-color: white;
                color: black;
                border-color: rgba(118, 118, 118, 1); 
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
        this.#changeToggleIcon(this.#isPlaying);
        this.dispatchEvent(
            new CustomEvent('timedimension-play', { bubbles: true, composed: true, detail: this.#isPlaying })
        )
    }

    #changeToggleIcon(isPlaying: boolean) {
        const icon: HTMLElement | null = this.#playBtn.querySelector('span.delorean-btn__icon');     
        if (!icon) return;
        icon.style.maskImage = `url('${isPlaying ? this.#playIcon : this.#pauseIcon}')`;
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

customElements.define('delorean-controller', DeloreanController)