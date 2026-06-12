import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CalendarPicker } from "../components/calendar-picker";
import { ExbaComponent, css, defineComponent, html, signal } from "../core/exba";

const [getName, setName] = signal("World");

class TestComponent extends ExbaComponent {
    styles() {
        return css`div { color: red; }`;
    }
    template() {
        return html`<div>Hello ${getName()}</div>`;
    }
}
defineComponent("test-component", TestComponent);

describe("WasmComponent Rendering", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("should render template with initial signal value", () => {
        const el = document.createElement("test-component") as TestComponent;
        document.body.appendChild(el);

        const shadow = el.shadowRoot;
        expect(shadow?.innerHTML).toContain("Hello World");
    });

    it("should update when signal changes", async () => {
        const el = document.createElement("test-component") as TestComponent;
        document.body.appendChild(el);

        setName("Vitest");
        await new Promise((resolve) => queueMicrotask(resolve as any));

        const shadow = el.shadowRoot;
        expect(shadow?.innerHTML).toContain("Hello Vitest");
    });
});

describe("CalendarPicker Component", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("should mount and render calendar picker", () => {
        expect(CalendarPicker).toBeDefined();
        const el = document.createElement("exba-calendar") as CalendarPicker;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        // Check if navigation buttons and elements are rendered
        expect(shadow?.innerHTML).toContain("◀");
        expect(shadow?.innerHTML).toContain("▶");
        expect(shadow?.innerHTML).toContain("Selected:");
    });

    it("should navigate to next and previous months", async () => {
        const el = document.createElement("exba-calendar") as CalendarPicker;
        document.body.appendChild(el);

        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const prevBtn = Array.from(shadow?.querySelectorAll("button") || []).find(
            (b) => b.textContent?.trim() === "◀",
        );
        const nextBtn = Array.from(shadow?.querySelectorAll("button") || []).find(
            (b) => b.textContent?.trim() === "▶",
        );

        expect(prevBtn).toBeDefined();
        expect(nextBtn).toBeDefined();

        // Let's click Next Month
        nextBtn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        // Let's click Previous Month
        prevBtn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));
    });
});

import { GeolocationDemo } from "../components/geolocation-demo";
import { NotificationDemo } from "../components/notification-demo";
import { ShareDemo } from "../components/share-demo";
import { StorageDemo } from "../components/storage-demo";

describe("GeolocationDemo Component", () => {
    let originalGeolocation: any;
    let mockGeoSuccess = true;

    beforeEach(() => {
        document.body.innerHTML = "";
        originalGeolocation = navigator.geolocation;

        const mockGeo = {
            getCurrentPosition: (success: (pos: any) => void, error: (err: any) => void) => {
                if (mockGeoSuccess) {
                    success({
                        coords: {
                            latitude: 37.7749,
                            longitude: -122.4194,
                        },
                    });
                } else {
                    error({ message: "User denied Geolocation" });
                }
            },
        };

        Object.defineProperty(navigator, "geolocation", {
            value: mockGeo,
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        if (originalGeolocation !== undefined) {
            Object.defineProperty(navigator, "geolocation", {
                value: originalGeolocation,
                configurable: true,
                writable: true,
            });
        }
    });

    it("should display coordinates when location retrieval succeeds", async () => {
        expect(GeolocationDemo).toBeDefined();
        mockGeoSuccess = true;
        const el = document.createElement("exba-geolocation-demo") as GeolocationDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const btn = shadow?.querySelector("button");
        expect(btn?.textContent).toBe("Get GPS Coordinates");

        btn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(shadow?.innerHTML).toContain("Latitude:  37.7749");
        expect(shadow?.innerHTML).toContain("Longitude: -122.4194");
    });

    it("should display error message when location retrieval fails", async () => {
        mockGeoSuccess = false;
        const el = document.createElement("exba-geolocation-demo") as GeolocationDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const btn = shadow?.querySelector("button");
        btn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(shadow?.innerHTML).toContain("Error: User denied Geolocation");
    });
});

describe("NotificationDemo Component", () => {
    let originalNotification: any;
    let notificationCreated = false;
    let permissionRequested = false;
    let mockNotificationPermission = "default";

    beforeEach(() => {
        document.body.innerHTML = "";
        originalNotification = (globalThis as any).Notification;
        notificationCreated = false;
        permissionRequested = false;
        mockNotificationPermission = "default";

        const mockNotification = class {
            static get permission() {
                return mockNotificationPermission;
            }
            static async requestPermission() {
                permissionRequested = true;
                mockNotificationPermission = "granted";
                return "granted";
            }
            constructor(title: string, options: any) {
                notificationCreated = true;
                expect(title).toBe("Hello from EXBA!");
                expect(options.body).toBe("This is a native desktop notification banner.");
            }
        };

        Object.defineProperty(globalThis, "Notification", {
            value: mockNotification,
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        if (originalNotification !== undefined) {
            Object.defineProperty(globalThis, "Notification", {
                value: originalNotification,
                configurable: true,
                writable: true,
            });
        }
    });

    it("should request permission and trigger notification when clicked", async () => {
        expect(NotificationDemo).toBeDefined();
        const el = document.createElement("exba-notification-demo") as NotificationDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const btn = shadow?.querySelector("button");
        expect(btn?.textContent).toBe("Send Native Notification");

        btn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(permissionRequested).toBe(true);
        expect(notificationCreated).toBe(true);
        expect(shadow?.innerHTML).toContain(
            "Notification Permission Status: <strong>granted</strong>",
        );
    });
});

describe("StorageDemo Component", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
    });

    it("should save values to localStorage and clear them on button click", async () => {
        expect(StorageDemo).toBeDefined();
        const el = document.createElement("exba-storage-demo") as StorageDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const input = shadow?.querySelector("input") as HTMLInputElement;
        const buttons = shadow?.querySelectorAll("button") || [];
        const saveBtn = Array.from(buttons).find((b) => b.textContent === "Save");
        const clearBtn = Array.from(buttons).find((b) => b.textContent === "Clear");

        expect(input).toBeDefined();
        expect(saveBtn).toBeDefined();
        expect(clearBtn).toBeDefined();

        // Type text and save
        input.value = "Test storage persist";
        input.dispatchEvent(new Event("input"));
        saveBtn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(localStorage.getItem("exba_storage_showcase")).toBe("Test storage persist");
        expect(shadow?.innerHTML).toContain(
            "Currently Saved: <strong>Test storage persist</strong>",
        );

        // Clear storage
        clearBtn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(localStorage.getItem("exba_storage_showcase")).toBeNull();
        expect(shadow?.innerHTML).toContain("Currently Saved: <strong>(empty)</strong>");
    });
});

describe("ShareDemo Component", () => {
    let originalShare: any;
    let originalClipboard: any;
    let shareCalledWith: any = null;
    let shareShouldFail = false;
    let copiedText = "";

    beforeEach(() => {
        document.body.innerHTML = "";
        originalShare = navigator.share;
        originalClipboard = navigator.clipboard;
        shareCalledWith = null;
        shareShouldFail = false;
        copiedText = "";

        const mockShare = async (data: any) => {
            if (shareShouldFail) {
                throw new Error("Share failed");
            }
            shareCalledWith = data;
        };

        const mockClipboard = {
            writeText: async (text: string) => {
                copiedText = text;
            },
        };

        Object.defineProperty(navigator, "share", {
            value: mockShare,
            configurable: true,
            writable: true,
        });

        Object.defineProperty(navigator, "clipboard", {
            value: mockClipboard,
            configurable: true,
            writable: true,
        });
    });

    afterEach(() => {
        if (originalShare !== undefined) {
            Object.defineProperty(navigator, "share", {
                value: originalShare,
                configurable: true,
                writable: true,
            });
        }
        if (originalClipboard !== undefined) {
            Object.defineProperty(navigator, "clipboard", {
                value: originalClipboard,
                configurable: true,
                writable: true,
            });
        }
    });

    it("should invoke navigator.share when available", async () => {
        expect(ShareDemo).toBeDefined();
        const el = document.createElement("exba-share-demo") as ShareDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const btn = shadow?.querySelector("button");
        btn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(shareCalledWith).not.toBeNull();
        expect(shareCalledWith.title).toBe("EXBA Framework");
        expect(shadow?.innerHTML).toContain("Successfully shared content!");
    });

    it("should fall back to clipboard copy when navigator.share is unavailable", async () => {
        expect(ShareDemo).toBeDefined();
        Object.defineProperty(navigator, "share", {
            value: undefined,
            configurable: true,
            writable: true,
        });

        const el = document.createElement("exba-share-demo") as ShareDemo;
        document.body.appendChild(el);
        const shadow = el.shadowRoot;
        expect(shadow).not.toBeNull();

        const btn = shadow?.querySelector("button");
        btn?.click();
        await new Promise((resolve) => queueMicrotask(resolve as any));

        expect(copiedText).toContain("Check out this awesome reactive Web Component framework");
        expect(shadow?.innerHTML).toContain("System share unsupported. Text copied to clipboard!");
    });
});
