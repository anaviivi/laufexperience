import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// DeepL
const DEEPL_API_KEY = process.env.DEEPL_API_KEY; // in .env.local setzen
const DEEPL_ENDPOINT = process.env.DEEPL_ENDPOINT || "https://api-free.deepl.com/v2/translate"; // oder api.deepl.com

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}
if (!DEEPL_API_KEY) {
  console.error("Missing DEEPL_API_KEY in env.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function deeplTranslate(text, targetLang = "EN") {
  if (!text || !String(text).trim()) return "";
  const params = new URLSearchParams();
  params.set("auth_key", DEEPL_API_KEY);
  params.set("text", String(text));
  params.set("target_lang", targetLang);

  const res = await fetch(DEEPL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DeepL error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json?.translations?.[0]?.text || "";
}

function isNonEmptyBlocks(b) {
  return Array.isArray(b) && b.length > 0;
}

async function translateBlocks(blocksDe) {
  if (!isNonEmptyBlocks(blocksDe)) return [];
  // Sehr konservativ: wir übersetzen alle "text"-Felder in Blocks.
  // Wenn dein Block-Schema anders ist, sag Bescheid, dann passe ich es an.
  const out = [];
  for (const block of blocksDe) {
    const b = { ...block };
    for (const k of Object.keys(b)) {
      if (typeof b[k] === "string") {
        // Nur längere Strings übersetzen (UI-keys o.ä. nicht)
        if (b[k].trim().length >= 2) {
          b[k] = await deeplTranslate(b[k], "EN");
        }
      }
    }
    out.push(b);
  }
  return out;
}

async function main() {
  // Hole alle Artikel
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, slug, title_de, subtitle_de, short_description_de, teaser_de, intro_de, content_de, blocks_de, title_en, blocks_en")
    .eq("deleted", false);

  if (error) throw error;
  console.log(`Found ${articles.length} articles`);

  let updated = 0;

  for (const a of articles) {
    const needsTitle = !a.title_en && a.title_de;
    const needsBlocks = !isNonEmptyBlocks(a.blocks_en) && isNonEmptyBlocks(a.blocks_de);

    if (!needsTitle && !needsBlocks) continue;

    const patch = {};

    if (needsTitle) patch.title_en = await deeplTranslate(a.title_de, "EN");
    if (!a.subtitle_en && a.subtitle_de) patch.subtitle_en = await deeplTranslate(a.subtitle_de, "EN");
    if (!a.short_description_en && a.short_description_de) patch.short_description_en = await deeplTranslate(a.short_description_de, "EN");
    if (!a.teaser_en && a.teaser_de) patch.teaser_en = await deeplTranslate(a.teaser_de, "EN");
    if (!a.intro_en && a.intro_de) patch.intro_en = await deeplTranslate(a.intro_de, "EN");
    if (!a.content_en && a.content_de) patch.content_en = await deeplTranslate(a.content_de, "EN");

    if (needsBlocks) patch.blocks_en = await translateBlocks(a.blocks_de);

    const { error: upErr } = await supabase.from("articles").update(patch).eq("id", a.id);
    if (upErr) throw upErr;

    updated++;
    console.log(`Updated ${a.slug}`);
  }

  console.log(`Done. Updated ${updated} articles.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
