const { execSync, spawn } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const projectDir = path.resolve(__dirname, "..");

console.log("1. Rebuilding the extension...");
try {
    execSync("bun run build", { stdio: "inherit", cwd: projectDir });
} catch (e) {
    console.error("Rebuild failed.");
    process.exit(1);
}

console.log("\n2. Linking the extension...");
try {
    execSync("node ./bin/link-extension.js", { stdio: "inherit", cwd: projectDir });
} catch (e) {
    console.error("Linking failed.");
    process.exit(1);
}

console.log("\n3. Launching Editor...");

const editors = [
    { cmd: "codium", args: ["."] },
    { cmd: "/usr/share/codium/codium", args: ["."] },
    { cmd: "cursor", args: ["."] },
    { cmd: "code", args: ["."] },
];

let launched = false;
for (const editor of editors) {
    try {
        // Use spawn to launch in background and detach
        const child = spawn(editor.cmd, editor.args, {
            detached: true,
            stdio: "ignore",
            cwd: projectDir,
        });

        child.unref();
        console.log(`Successfully launched ${editor.cmd}!`);
        launched = true;
        break;
    } catch (err) {
        // Command not found, try next
    }
}

if (!launched) {
    console.error("\nCould not find codium, cursor, or code command in your PATH.");
    console.log(
        "Please make sure VSCodium or Cursor is installed and its CLI command is available.",
    );
}
