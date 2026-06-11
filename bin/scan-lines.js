const fs = require("node:fs");
const path = require("node:path");

const MAX_FILES = 10;
const IGNORE_PATHS = ["node_modules", "dist", ".git", ".github", "target", "bin"];
const EXTENSIONS = [".ts", ".js", ".rs", ".json", ".html", ".css"];

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            // Check if directory name is in IGNORE_PATHS
            if (IGNORE_PATHS.includes(file)) {
                continue;
            }
            walkDir(fullPath, callback);
        } else if (stat.isFile()) {
            if (EXTENSIONS.includes(path.extname(fullPath))) {
                callback(fullPath);
            }
        }
    }
}

function scanLongFiles() {
    console.log("🔍 Scanning for the files with the most lines in the codebase...\n");
    const results = [];
    const seenFiles = new Set();

    try {
        walkDir(".", (filePath) => {
            const absolutePath = path.resolve(filePath);
            if (seenFiles.has(absolutePath)) {
                return;
            }
            seenFiles.add(absolutePath);

            const content = fs.readFileSync(filePath, "utf8");
            // Count total lines (split by newline)
            const lines = content.split(/\r?\n/);
            const totalLines = lines.length;

            if (totalLines > 0) {
                // Normalize path to use forward slashes for consistency
                const normalizedPath = path.relative(".", filePath).split(path.sep).join("/");
                results.push({
                    filePath: normalizedPath,
                    lines: totalLines,
                });
            }
        });

        // Sort by total lines descending
        results.sort((a, b) => b.lines - a.lines);

        console.log("------------------------------------------------------------");
        console.log(`${"Lines".padEnd(8)} | File`);
        console.log("------------------------------------------------------------");

        const displayCount = Math.min(results.length, MAX_FILES);
        for (let i = 0; i < displayCount; i++) {
            const item = results[i];
            console.log(`${String(item.lines).padEnd(8)} | ${item.filePath}`);
        }
        console.log("------------------------------------------------------------");
    } catch (e) {
        console.error("Error scanning lines:", e.message);
        process.exit(1);
    }
}

scanLongFiles();
