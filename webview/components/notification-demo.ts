import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, signal } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 0.5rem;
    `,
    btn: (css: any) => css`
        background: rgba(167, 139, 250, 0.15);
        border: 1px solid rgba(167, 139, 250, 0.3);
        color: #a78bfa;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        width: fit-content;
        outline: none;
        &:hover {
            background: rgba(167, 139, 250, 0.25);
        }
    `,
    status: (css: any) => css`
        font-size: 0.75rem;
        color: #94a3b8;
    `,
};

export class NotificationDemo extends ExbaComponent {
    private _permission = signal<string>(
        typeof Notification !== "undefined" ? Notification.permission : "unsupported",
    );
    private gCss: any;
    private classes!: any;

    constructor() {
        super();
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.classes = {
            container: styles.container(this.gCss),
            btn: styles.btn(this.gCss),
            status: styles.status(this.gCss),
        };
        super.connectedCallback();
    }

    styles() {
        return ":host { display: block; }";
    }

    async handleSendNotification() {
        if (typeof Notification === "undefined") {
            return;
        }

        if (Notification.permission === "default") {
            const result = await Notification.requestPermission();
            this._permission[1](result);
        }

        if (Notification.permission === "granted") {
            new Notification("Hello from EXBA!", {
                body: "This is a native desktop notification banner.",
            });
        }
    }

    template() {
        const permission = this._permission[0]();
        return html`
            <div class="${this.classes.container}">
                <button class="${this.classes.btn}" on-click="handleSendNotification">Send Native Notification</button>
                <div class="${this.classes.status}">
                    Notification Permission Status: <strong>${permission}</strong>
                </div>
            </div>
        `;
    }
}
defineComponent("exba-notification-demo", NotificationDemo);
