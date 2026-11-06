import assert from "node:assert/strict";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(".");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "styles.css"), "utf8");
const sourceRoot = join(root, "src");

function collectJavaScript(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectJavaScript(path) : path.endsWith(".js") ? [path] : [];
  });
}

const jsFiles = collectJavaScript(sourceRoot);
assert.ok(jsFiles.length >= 5, "Expected the modular gameplay source files");

for (const file of jsFiles) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  assert.equal(result.status, 0, "JavaScript syntax error in " + file + ": " + result.stderr);
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/from\s+["'](\.[^"']+)["']/g)) {
    const dependency = resolve(file, "..", match[1]);
    assert.ok(existsSync(dependency), "Missing module import " + match[1] + " in " + file);
  }
}

const main = readFileSync(join(sourceRoot, "main.js"), "utf8");
for (const match of main.matchAll(/\$\("#([a-z0-9-]+)"\)/g)) {
  assert.ok(html.includes('id="' + match[1] + '"'), "Missing HTML element #" + match[1]);
}
for (const direction of ["up", "down", "left", "right"]) {
  assert.ok(html.includes('data-direction="' + direction + '"'), "Missing " + direction + " movement button");
}
assert.ok(css.includes("-webkit-tap-highlight-color: transparent"), "Mobile tap highlight suppression is missing");
assert.ok(!/joystick/i.test(html + css + main), "Old joystick markup or wiring remains");
assert.ok(html.includes("src/main.js"), "Module entry point is missing");

console.log("Project validation passed: " + jsFiles.length + " JavaScript modules checked, imports resolved, UI hooks verified.");
