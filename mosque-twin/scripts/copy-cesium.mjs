// Cesium needs its Workers, Assets, ThirdParty and Widgets folders served as
// static files. This copies them into public/cesium before `dev` and `build`.
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "cesium", "Build", "Cesium");
const target = join(root, "public", "cesium");

if (!existsSync(source)) {
  console.error("Cesium is not installed yet. Run `npm install` first.");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
for (const dir of ["Workers", "ThirdParty", "Assets", "Widgets"]) {
  cpSync(join(source, dir), join(target, dir), { recursive: true });
}
console.log("Copied Cesium static assets to public/cesium");
