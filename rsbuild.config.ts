import path from "node:path";
import { defineConfig } from "@rsbuild/core";

export default defineConfig({
    source: {
        entry: {
            index: "./webview/components/app-component.ts",
        },
    },
    output: {
        distPath: {
            root: path.join(__dirname, "dist/webview"),
            js: "./",
            css: "./",
        },
        filename: {
            js: "bundle.[contenthash].js",
            css: "index.[contenthash].css",
        },
        assetPrefix: "./",
    },
    html: {
        template: "./webview/index.html",
    },
});
