/**
 * BDSD bus city master list — CSV → JSON builder (offline).
 *
 *   npx tsx scripts/build-bus-cities.ts [--csv <path>] [--out <path>]
 *
 * BDSD's bus `search` endpoint takes numeric OriginId/DestinationId and their
 * documentation exposes no city-list endpoint, so the mapping has to come from
 * the master list they send by email. This turns that CSV into the JSON the app
 * ships in src/data/bus-cities.json.
 *
 * The CSV columns are `id,city_id,city_name,priority`:
 *   - `city_id` is the value BDSD wants as OriginId/DestinationId. Verified
 *     against the two ids in their own docs sample: Bangalore 8463,
 *     Hyderabad 9573.
 *   - `id` is only a row number in their export and is discarded.
 *   - `priority` is set on four cities (Delhi, Shimla, Mumbai, Goa) and is kept
 *     as the "featured" ordering for an empty search box.
 *
 * Re-run this whenever BDSD sends a refreshed list. No network I/O.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const csvPath = resolve(arg("csv", "bus_city_list.csv"));
const outPath = resolve(arg("out", "src/data/bus-cities.json"));

/** Minimal RFC-4180 row splitter — the export quotes every field. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c !== ""));
}

const rows = parseCsv(readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
const header = rows[0].map((h) => h.trim().toLowerCase());
const iCityId = header.indexOf("city_id");
const iName = header.indexOf("city_name");
const iPriority = header.indexOf("priority");
if (iCityId < 0 || iName < 0) throw new Error(`csv is missing city_id/city_name: ${header.join(",")}`);

const seen = new Set<number>();
const cities: [number, string][] = [];
const featured: { id: number; priority: number }[] = [];

for (const r of rows.slice(1)) {
  const id = Number(r[iCityId]);
  // Their names carry stray leading/trailing spaces on ~85 rows.
  const name = (r[iName] ?? "").trim();
  if (!Number.isFinite(id) || id <= 0 || !name) continue;
  if (seen.has(id)) continue; // ids are unique today; guard against a bad refresh
  seen.add(id);
  cities.push([id, name]);
  const p = Number(r[iPriority]);
  if (Number.isFinite(p) && p > 0) featured.push({ id, priority: p });
}

cities.sort((a, b) => a[1].localeCompare(b[1], "en"));
featured.sort((a, b) => a.priority - b.priority);

const payload = {
  source: "BDSD Technology bus city master list (emailed by the client 2026-08-08)",
  count: cities.length,
  featured: featured.map((f) => f.id),
  cities,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(payload));
console.log(`wrote ${outPath}: ${cities.length} cities, featured ${payload.featured.join(", ")}`);
