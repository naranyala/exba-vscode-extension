import { css as gooberCss } from "goober";
import { ExbaComponent, defineComponent, html, signal } from "../core/exba";

const styles = {
    container: (css: any) => css`
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        background: rgba(15, 23, 42, 0.25);
        border: 1px solid rgba(255, 255, 255, 0.04);
        border-radius: 16px;
        padding: 1rem;
        max-width: 300px;
        margin: 0 auto;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    `,
    header: (css: any) => css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    `,
    monthTitle: (css: any) => css`
        font-size: 0.85rem;
        font-weight: 700;
        color: #ffffff;
    `,
    navActions: (css: any) => css`
        display: flex;
        gap: 0.25rem;
    `,
    navBtn: (css: any) => css`
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #cbd5e1;
        border-radius: 6px;
        width: 24px;
        height: 24px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        cursor: pointer;
        outline: none;
        &:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
        }
    `,
    weekdays: (css: any) => css`
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        text-align: center;
        font-weight: bold;
        font-size: 0.65rem;
        color: #64748b;
        margin-bottom: 0.25rem;
    `,
    daysGrid: (css: any) => css`
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.25rem;
        text-align: center;
    `,
    emptyDay: (css: any) => css`
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        background: none;
        border: none;
        outline: none;
        cursor: default;
        opacity: 0;
    `,
    day: (css: any) => css`
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        color: #cbd5e1;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.15s ease;
        background: none;
        border: 1px solid transparent;
        font-family: inherit;
        outline: none;
        font-weight: normal;
        box-shadow: none;
        &:hover {
            background: rgba(167, 139, 250, 0.15);
            color: #a78bfa;
        }
        &.today {
            color: #818cf8;
            border-color: #6366f1;
            font-weight: bold;
        }
        &.selected {
            color: #ffffff !important;
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%) !important;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
        }
        &.selected:hover {
            background: linear-gradient(135deg, #a78bfa 0%, #6366f1 100%) !important;
            color: #ffffff !important;
        }
    `,
    footerInfo: (css: any) => css`
        text-align: center;
        font-size: 0.7rem;
        color: #64748b;
        margin-top: 0.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 0.5rem;
    `,
    selectedText: (css: any) => css`
        color: #a78bfa;
        font-weight: bold;
        font-family: monospace;
    `,
};

export class CalendarPicker extends ExbaComponent {
    private today = new Date();
    private _selectedDate = signal<Date | null>(new Date());
    private _viewDate = signal<{ year: number; month: number }>({
        year: this.today.getFullYear(),
        month: this.today.getMonth(),
    });

    private gCss: any;
    private classes!: {
        container: string;
        header: string;
        monthTitle: string;
        navActions: string;
        navBtn: string;
        weekdays: string;
        daysGrid: string;
        emptyDay: string;
        day: string;
        footerInfo: string;
        selectedText: string;
    };

    constructor() {
        super();
        // Bind goober's css to target this component's shadow DOM
        this.gCss = gooberCss.bind({ target: this.shadow });
    }

    connectedCallback() {
        this.initStyles();
        super.connectedCallback();
    }

    styles() {
        return "";
    }

    private initStyles() {
        this.classes = {
            container: styles.container(this.gCss),
            header: styles.header(this.gCss),
            monthTitle: styles.monthTitle(this.gCss),
            navActions: styles.navActions(this.gCss),
            navBtn: styles.navBtn(this.gCss),
            weekdays: styles.weekdays(this.gCss),
            daysGrid: styles.daysGrid(this.gCss),
            emptyDay: styles.emptyDay(this.gCss),
            day: styles.day(this.gCss),
            footerInfo: styles.footerInfo(this.gCss),
            selectedText: styles.selectedText(this.gCss),
        };
    }

    handlePrevMonth() {
        const [get, set] = this._viewDate;
        const current = get();
        if (current.month === 0) {
            set({ year: current.year - 1, month: 11 });
        } else {
            set({ year: current.year, month: current.month - 1 });
        }
    }

    handleNextMonth() {
        const [get, set] = this._viewDate;
        const current = get();
        if (current.month === 11) {
            set({ year: current.year + 1, month: 0 });
        } else {
            set({ year: current.year, month: current.month + 1 });
        }
    }

    handleToday() {
        const today = new Date();
        this._viewDate[1]({ year: today.getFullYear(), month: today.getMonth() });
        this._selectedDate[1](today);
    }

    handleSelectDay(e: Event) {
        const btn = e.currentTarget as HTMLElement;
        const dayStr = btn.getAttribute("data-day");
        if (!dayStr) return;

        const day = Number.parseInt(dayStr);
        const { year, month } = this._viewDate[0]();
        const selected = new Date(year, month, day);
        this._selectedDate[1](selected);
    }

    template() {
        const { year, month } = this._viewDate[0]();
        const selected = this._selectedDate[0]();

        const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
        ];
        const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

        // Days in month calculation
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Weekday of the first day of the month
        const firstDayIndex = new Date(year, month, 1).getDay();

        const days = [];

        // Fill empty spaces for first week padding
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(html`<div class="${this.classes.emptyDay}"></div>`);
        }

        // Fill month days
        for (let d = 1; d <= daysInMonth; d++) {
            const isToday =
                this.today.getDate() === d &&
                this.today.getMonth() === month &&
                this.today.getFullYear() === year;

            const isSelected =
                selected !== null &&
                selected.getDate() === d &&
                selected.getMonth() === month &&
                selected.getFullYear() === year;

            const dayClass = [
                this.classes.day,
                isToday ? "today" : "",
                isSelected ? "selected" : "",
            ]
                .filter(Boolean)
                .join(" ");

            days.push(html`
                <button class="${dayClass}" data-day="${d}" on-click="handleSelectDay">
                    ${d}
                </button>
            `);
        }

        const selectedText = selected
            ? `${monthNames[selected.getMonth()]} ${selected.getDate()}, ${selected.getFullYear()}`
            : "None";

        return html`
            <div class="${this.classes.container}">
                <div class="${this.classes.header}">
                    <span class="${this.classes.monthTitle}">${monthNames[month]} ${year}</span>
                    <div class="${this.classes.navActions}">
                        <button class="${this.classes.navBtn}" on-click="handlePrevMonth">◀</button>
                        <button class="${this.classes.navBtn}" on-click="handleToday">●</button>
                        <button class="${this.classes.navBtn}" on-click="handleNextMonth">▶</button>
                    </div>
                </div>

                <div class="${this.classes.weekdays}">
                    ${weekdays.map((w) => html`<div>${w}</div>`).join("")}
                </div>

                <div class="${this.classes.daysGrid}">
                    ${days.join("")}
                </div>

                <div class="${this.classes.footerInfo}">
                    Selected: <span class="${this.classes.selectedText}">${selectedText}</span>
                </div>
            </div>
        `;
    }
}
defineComponent("exba-calendar", CalendarPicker);
