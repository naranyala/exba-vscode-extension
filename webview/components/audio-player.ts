import WaveSurfer from 'wavesurfer.js';

export class AudioPlayerComponent extends HTMLElement {
    private wavesurfer: WaveSurfer | null = null;
    private container: HTMLDivElement | null = null;

    static get observedAttributes() {
        return ['src'];
    }

    connectedCallback() {
        this.innerHTML = `
            <input type="file" id="fileInput" accept="audio/*" style="margin-bottom: 1rem;" />
            <div id="waveform" style="width: 100%; height: 128px; background: rgba(30, 41, 59, 0.4); border-radius: 12px; margin-bottom: 1rem;"></div>
            <button id="playPauseBtn" style="padding: 0.5rem 1rem; cursor: pointer;">Play/Pause</button>
        `;
        
        this.container = this.querySelector('#waveform');
        const playPauseBtn = this.querySelector('#playPauseBtn') as HTMLButtonElement;
        const fileInput = this.querySelector('#fileInput') as HTMLInputElement;

        this.wavesurfer = WaveSurfer.create({
            container: this.container!,
            waveColor: '#a78bfa',
            progressColor: '#6366f1',
            cursorColor: '#ffffff',
            barWidth: 2,
            responsive: true,
        });

        playPauseBtn.addEventListener('click', () => {
            this.wavesurfer?.playPause();
        });

        fileInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                const url = URL.createObjectURL(file);
                this.wavesurfer?.load(url);
            }
        });
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === 'src' && oldValue !== newValue && this.wavesurfer) {
            this.wavesurfer.load(newValue);
        }
    }

    disconnectedCallback() {
        this.wavesurfer?.destroy();
    }
}

customElements.define("audio-player", AudioPlayerComponent);
