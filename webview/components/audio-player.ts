import WaveSurfer from "wavesurfer.js";
import { ExbaComponent, css, defineComponent, onAfterRender, onCleanup } from "../core/exba";

export class AudioPlayerComponent extends ExbaComponent {
    private wavesurfer: WaveSurfer | null = null;

    styles() {
        return css`
            :host {
                display: block;
            }
            .container {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                padding: 0.5rem;
            }
            .file-input {
                background: rgba(15, 23, 42, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                color: #cbd5e1;
                font-size: 0.75rem;
                padding: 0.4rem;
                cursor: pointer;
            }
            .file-input::file-selector-button {
                background: rgba(167, 139, 250, 0.15);
                border: 1px solid rgba(167, 139, 250, 0.3);
                color: #a78bfa;
                padding: 0.3rem 0.7rem;
                border-radius: 6px;
                font-size: 0.7rem;
                font-weight: 600;
                cursor: pointer;
                margin-right: 0.5rem;
            }
            .waveform {
                width: 100%;
                height: 128px;
                background: rgba(30, 41, 59, 0.4);
                border-radius: 12px;
                overflow: hidden;
            }
            .play-btn {
                background: rgba(167, 139, 250, 0.15);
                border: 1px solid rgba(167, 139, 250, 0.3);
                color: #a78bfa;
                padding: 0.5rem 1.5rem;
                border-radius: 8px;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                width: fit-content;
                outline: none;
            }
            .play-btn:hover {
                background: rgba(167, 139, 250, 0.25);
            }
        `;
    }

    connectedCallback() {
        super.connectedCallback();
        onAfterRender(() => {
            const container = this.shadow.querySelector(".waveform") as HTMLDivElement;
            if (!container) return;

            this.wavesurfer = WaveSurfer.create({
                container,
                waveColor: "#a78bfa",
                progressColor: "#6366f1",
                cursorColor: "#ffffff",
                barWidth: 2,
                responsive: true,
            });

            const fileInput = this.shadow.querySelector(".file-input") as HTMLInputElement;
            fileInput.addEventListener("change", (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files.length > 0) {
                    const url = URL.createObjectURL(target.files[0]);
                    this.wavesurfer?.load(url);
                }
            });

            const playBtn = this.shadow.querySelector(".play-btn") as HTMLButtonElement;
            playBtn.addEventListener("click", () => {
                this.wavesurfer?.playPause();
            });
        });

        onCleanup(() => {
            this.wavesurfer?.destroy();
            this.wavesurfer = null;
        });
    }

    template() {
        return `
            <div class="container">
                <input type="file" class="file-input" accept="audio/*" />
                <div class="waveform"></div>
                <button class="play-btn">Play / Pause</button>
            </div>
        `;
    }
}

defineComponent("audio-player", AudioPlayerComponent);
