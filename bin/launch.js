const { execSync, spawn } = require("node:child_process");
const path = require("node:path");

const projectDir = path.resolve(__dirname, "..");

console.log("1. Rebuilding the extension...");
try {
    execSync("bun run build", { stdio: "inherit", cwd: projectDir });
} catch (e) {
    console.error("Rebuild failed.");
    process.exit(1);
}

console.log("\n2. Launching Editor with extension path...");

const editors = [
    { cmd: "code", args: [`--extensionDevelopmentPath=${projectDir}`, "."] },
    { cmd: "codium", args: [`--extensionDevelopmentPath=${projectDir}`, "."] },
    { cmd: "/usr/share/codium/codium", args: [`--extensionDevelopmentPath=${projectDir}`, "."] },
    { cmd: "cursor", args: [`--extensionDevelopmentPath=${projectDir}`, "."] },
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
