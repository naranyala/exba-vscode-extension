const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const home = process.env.HOME || process.env.USERPROFILE;
if (!home) {
    console.error("Could not find user home directory.");
    process.exit(1);
}

// Common VS Code / Editor extensions directories
const targetDirs = [
    path.join(home, ".vscode/extensions"),
    path.join(home, ".vscode-insiders/extensions"),
    path.join(home, ".vscode-oss/extensions"),
    path.join(home, ".cursor/extensions"),
];

const projectDir = path.resolve(__dirname, "..");
const pkg = require(path.join(projectDir, "package.json"));
const extensionId = `${pkg.publisher}.${pkg.name}-${pkg.version}`;

// Ensure build exists
if (!fs.existsSync(path.join(projectDir, "dist"))) {
    console.log("dist directory not found. Running build...");
    try {
        execSync("bun run build", { stdio: "inherit", cwd: projectDir });
    } catch (e) {
        console.error("Build failed.");
        process.exit(1);
    }
}

let linkedAny = false;
for (const extensionsDir of targetDirs) {
    const parentDir = path.dirname(extensionsDir);
    if (fs.existsSync(parentDir)) {
        try {
            if (!fs.existsSync(extensionsDir)) {
                fs.mkdirSync(extensionsDir, { recursive: true });
            }
            const symlinkPath = path.join(extensionsDir, extensionId);

            // Remove existing symlink or folder if present
            try {
                const stat = fs.lstatSync(symlinkPath);
                if (stat.isSymbolicLink() || stat.isDirectory() || stat.isFile()) {
                    fs.rmSync(symlinkPath, { recursive: true, force: true });
                }
            } catch (e) {
                // Doesn't exist, ignore
            }

            fs.symlinkSync(projectDir, symlinkPath, "dir");
            console.log(`Successfully linked extension to: ${symlinkPath}`);
            linkedAny = true;
        } catch (err) {
            console.error(`Failed to link to ${extensionsDir}:`, err.message);
        }
    }
}

if (linkedAny) {
    console.log("\nLink successful! To activate the extension:");
    console.log("1. Open or reload your editor (Command Palette -> 'Developer: Reload Window').");
    console.log("2. The extension will be loaded dynamically from this source directory.");
    console.log(
        "3. Any rebuild (e.g. running 'bun run build') will be instantly available on reload!",
    );
} else {
    console.log(
        `\nNo supported editor directories found. Checked paths:\n${targetDirs.join("\n")}`,
    );
}
