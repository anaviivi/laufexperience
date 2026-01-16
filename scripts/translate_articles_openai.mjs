import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (backend/.env).");
  process.exit(1);
}
if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY (backend/.env).");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const client = new OpenAI({ apiKey: OPENAI_API_KEY });

const hasBlocks = (x) => Array.isArray(x) && x.length > 0;

async function translateText(deText) {
  const text = String(deText || "").trim();
  if (!text) return "";

  // Responses API (empfohlen) :contentReference[oaicite:5]{index=5}
  const resp = await client.responses.create({
    model: MODEL,
    input: [
      {
        role: "system",
        content:
          "You are a professional translator. Translate from German to English. " +
          "Keep meaning, tone, and formatting (like punctuation). Do not add explanations.",
      },
      { role: "user", content: text },
    ],
  });

  // output_text ist die zusammengefasste Textausgabe
  const out = resp.output_text?.trim?.() || "";
  return out;
}

// Rekursiv: übersetzt alle String-Werte in einem JSON-Objekt/Array
async function translateAny(value) {
  if (value == null) return value;

  if (typeof value === "string") {
    const v = value.trim();
    if (!v) return value;
    // sehr kurze "keys" nicht anfassen (z.B. "h1", "cta")
    if (v.length <= 1) return value;
    return await translateText(value);
  }

  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) out.push(await translateAny(item));
    return out;
  }

  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      // Schlüssel nicht übersetzen
      out[k] = await translateAny(v);
    }
    return out;
  }

  return value;
}

async function main() {
  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "id, slug, deleted, title_de, subtitle_de, short_description_de, teaser_de, intro_de, content_de, blocks_de, title_en, subtitle_en, short_description_en, teaser_en, intro_en, content_en, blocks_en"
    )
    .eq("deleted", false);

  if (error) throw error;

  console.log(`Found ${articles.length} articles`);

  let updated = 0;

  for (const a of articles) {
    const patch = {};

    // Textfelder nur füllen, wenn EN leer ist
    if (!a.title_en && a.title_de) patch.title_en = await translateText(a.title_de);
    if (!a.subtitle_en && a.subtitle_de) patch.subtitle_en = await translateText(a.subtitle_de);
    if (!a.short_description_en && a.short_description_de)
      patch.short_description_en = await translateText(a.short_description_de);
    if (!a.teaser_en && a.teaser_de) patch.teaser_en = await translateText(a.teaser_de);
    if (!a.intro_en && a.intro_de) patch.intro_en = await translateText(a.intro_de);
    if (!a.content_en && a.content_de) patch.content_en = await translateText(a.content_de);

    // Blocks: wenn blocks_en leer, blocks_de -> blocks_en übersetzen
    if (!hasBlocks(a.blocks_en) && hasBlocks(a.blocks_de)) {
      patch.blocks_en = await translateAny(a.blocks_de);
    }

    if (Object.keys(patch).length === 0) continue;

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
