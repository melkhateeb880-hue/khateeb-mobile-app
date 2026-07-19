import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const source = resolve("public");
const destination = resolve("dist");

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log("PWA manifest, service worker, and icons copied to dist.");
