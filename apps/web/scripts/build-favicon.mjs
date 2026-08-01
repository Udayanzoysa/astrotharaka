import { createRequire } from "module";
import { copyFileSync, existsSync, writeFileSync, readFileSync, statSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const repoRoot = join(webRoot, "..", "..");

const sharp = require(
  join(repoRoot, "node_modules", ".pnpm", "sharp@0.34.5", "node_modules", "sharp"),
);

const brandDir = join(webRoot, "public", "brand");
const publicDir = join(webRoot, "public");
const appDir = join(webRoot, "src", "app");
const sourceJpg = join(brandDir, "taraka-mark.source.jpg");
const currentMark = join(brandDir, "taraka-mark.png");

if (!existsSync(sourceJpg) && existsSync(currentMark)) {
  copyFileSync(currentMark, sourceJpg);
}

const source = existsSync(sourceJpg) ? sourceJpg : currentMark;
const base = () => sharp(source).rotate();

await base().resize(512, 512, { fit: "cover" }).png().toFile(currentMark);
await base().resize(512, 512, { fit: "cover" }).png().toFile(join(publicDir, "favicon.png"));
// App Router metadata files only (do not also put these under public/ — Next conflicts).
await base().resize(32, 32, { fit: "cover" }).png().toFile(join(appDir, "icon.png"));
await base().resize(180, 180, { fit: "cover" }).png().toFile(join(appDir, "apple-icon.png"));

const png16 = await base().resize(16, 16, { fit: "cover" }).png().toBuffer();
const png32 = await base().resize(32, 32, { fit: "cover" }).png().toBuffer();
const png48 = await base().resize(48, 48, { fit: "cover" }).png().toBuffer();

writeFileSync(join(publicDir, "favicon-16.png"), png16);
writeFileSync(join(publicDir, "favicon-32.png"), png32);

const pngToIcoPath = join(
  process.env.USERPROFILE || "",
  "AppData/Local/Temp/cursor-sandbox-cache/2138a6b16a51425f67174ce536018d89/npm/_npx/94e6c7d88b079398/node_modules/png-to-ico/index.js",
);

let pngToIco;
if (existsSync(pngToIcoPath)) {
  pngToIco = (await import(`file:///${pngToIcoPath.replace(/\\/g, "/")}`)).default;
} else {
  // Fallback: install via dynamic npx path not available — use to-ico from npm if present
  pngToIco = (await import("png-to-ico")).default;
}

const ico = await pngToIco([png16, png32, png48]);
// Only app/favicon.ico — public/favicon.ico conflicts with the App Router file in Next.js.
writeFileSync(join(appDir, "favicon.ico"), ico);

const magic = (p) =>
  [...readFileSync(p).subarray(0, 4)].map((x) => x.toString(16).padStart(2, "0")).join(" ");

for (const rel of [
  "public/brand/taraka-mark.png",
  "public/favicon.png",
  "src/app/favicon.ico",
  "src/app/icon.png",
  "src/app/apple-icon.png",
]) {
  const p = join(webRoot, rel);
  console.log(`${rel}: ${magic(p)} (${statSync(p).size} bytes)`);
}
