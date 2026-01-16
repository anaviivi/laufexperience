// supabase/functions/translate-article/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-requested-with",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

type Lang = "de" | "en";

type TranslateBody = {
  article_id: string;
  source_lang?: Lang; // optional (auto-detect from target)
  target_lang: Lang;
  force?: boolean; // overwrite target even if filled
};

type ArticleRow = {
  id: string;

  // bilingual columns (adjust if your schema differs)
  title_de: string | null;
  title_en: string | null;

  subtitle_de: string | null;
  subtitle_en: string | null;

  teaser_de: string | null;
  teaser_en: string | null;

  short_description_de: string | null;
  short_description_en: string | null;

  intro_de: string | null;
  intro_en: string | null;

  content_de: string | null;
  content_en: string | null;

  blocks_de: unknown | null;
  blocks_en: unknown | null;

  layout_elements_de: unknown | null;
  layout_elements_en: unknown | null;

  // optional legacy fields (if you have them; harmless if null)
  title?: string | null;
  subtitle?: string | null;
  teaser?: string | null;
  short_description?: string | null;
  intro?: string | null;
  content?: string | null;
  blocks?: unknown | null;
  layout_elements?: unknown | null;
};

function isEmptyString(v: unknown) {
  return v == null || (typeof v === "string" && v.trim().length === 0);
}
function isEmptyJson(v: unknown) {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as Record<string, unknown>).length === 0;
  return false;
}
function shouldWrite(targetVal: unknown, force: boolean) {
  if (force) return true;
  if (typeof targetVal === "string") return targetVal.trim().length === 0;
  if (Array.isArray(targetVal)) return targetVal.length === 0;
  if (targetVal && typeof targetVal === "object") return Object.keys(targetVal as Record<string, unknown>).length === 0;
  return targetVal == null;
}

function pickSourceString(article: ArticleRow, field: string, source: Lang): string {
  const key = `${field}_${source}` as keyof ArticleRow;
  const v = (article as any)[key];
  if (typeof v === "string" && v.trim()) return v;

  // fallback: if bilingual field empty, try legacy field (only if string)
  const legacy = (article as any)[field];
  if (typeof legacy === "string" && legacy.trim()) return legacy;

  return "";
}

function pickSourceJson(article: ArticleRow, field: string, source: Lang): unknown {
  const key = `${field}_${source}` as keyof ArticleRow;
  const v = (article as any)[key];
  if (v != null && !isEmptyJson(v)) return v;

  // fallback: legacy json
  const legacy = (article as any)[field];
  if (legacy != null && !isEmptyJson(legacy)) return legacy;

  return null;
}

async function openaiTranslateText(text: string, source: Lang, target: Lang): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) throw new Error("OPENAI_API_KEY missing (set Supabase secret)");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            `You are a professional translator. Translate from ${source.toUpperCase()} to ${target.toUpperCase()}.\n` +
            `Keep meaning, be natural, do not add extra text.\n` +
            `If the input contains simple HTML tags, preserve them.`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${t}`);
  }

  const jsonRes = await res.json();
  const out = jsonRes?.choices?.[0]?.message?.content;
  if (typeof out !== "string") throw new Error("OpenAI returned no text");
  return out.trim();
}

// Best-effort: preserve tags by translating only text chunks
async function translateHtmlLike(input: string, source: Lang, target: Lang) {
  if (!/<[a-z][\s\S]*>/i.test(input)) {
    return await openaiTranslateText(input, source, target);
  }
  const parts = input.split(/(<[^>]+>)/g).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p.startsWith("<") && p.endsWith(">")) {
      out.push(p);
    } else {
      if (!p.trim()) out.push(p);
      else out.push(await openaiTranslateText(p, source, target));
    }
  }
  return out.join("");
}

// translate JSON blocks (recursively), focusing on common text keys
async function translateBlocks(blocks: unknown, source: Lang, target: Lang): Promise<unknown> {
  if (!Array.isArray(blocks)) return blocks;

  const TEXT_KEYS = new Set([
    "title",
    "subtitle",
    "heading",
    "subheading",
    "text",
    "content",
    "body",
    "caption",
    "label",
    "quote",
    "cta",
    "buttonText",
    "button_label",
    "buttonLabel",
    "description",
  ]);

  const translateAny = async (val: unknown): Promise<unknown> => {
    if (typeof val === "string") {
      if (!val.trim()) return val;
      return await translateHtmlLike(val, source, target);
    }
    if (Array.isArray(val)) {
      const arr: unknown[] = [];
      for (const v of val) arr.push(await translateAny(v));
      return arr;
    }
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string" && TEXT_KEYS.has(k)) {
          out[k] = await translateHtmlLike(v, source, target);
        } else {
          out[k] = await translateAny(v);
        }
      }
      return out;
    }
    return val;
  };

  const result: unknown[] = [];
  for (const b of blocks) result.push(await translateAny(b));
  return result;
}

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return json({ ok: false, error: "Missing Supabase env vars" }, 500);
    }

    // Admin client (service role) to read/update articles
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = (await req.json()) as TranslateBody;

    const article_id = body.article_id;
    const target = (body.target_lang || "en") as Lang;
    const force = !!body.force;

    if (!article_id) return json({ ok: false, error: "article_id missing" }, 400);
    if (target !== "de" && target !== "en")
      return json({ ok: false, error: "target_lang must be 'de' or 'en'" }, 400);

    // If source not provided: infer opposite (target de => source en, target en => source de)
    const source = (body.source_lang || (target === "de" ? "en" : "de")) as Lang;

    // Fetch article
    const { data: article, error: artErr } = await supabaseAdmin
      .from("articles")
      .select(
        `
        id,
        title_de, title_en,
        subtitle_de, subtitle_en,
        teaser_de, teaser_en,
        short_description_de, short_description_en,
        intro_de, intro_en,
        content_de, content_en,
        blocks_de, blocks_en,
        layout_elements_de, layout_elements_en,
        title, subtitle, teaser, short_description, intro, content, blocks, layout_elements
      `,
      )
      .eq("id", article_id)
      .single();

    if (artErr) return json({ ok: false, error: "Article lookup failed", details: artErr.message }, 500);
    if (!article) return json({ ok: false, error: "Article not found" }, 404);

    const a = article as ArticleRow;

    // Build updates
    const updates: Record<string, unknown> = {};

    const fields = ["title", "subtitle", "teaser", "short_description", "intro", "content"] as const;

    for (const f of fields) {
      const srcText = pickSourceString(a, f, source);
      if (!srcText.trim()) continue;

      const targetKey = `${f}_${target}`;
      const currentTargetVal = (a as any)[targetKey];

      if (!shouldWrite(currentTargetVal, force)) continue;

      const translated = await translateHtmlLike(srcText, source, target);
      updates[targetKey] = translated;
    }

    // Blocks
    const srcBlocks = pickSourceJson(a, "blocks", source);
    const tgtBlocksKey = `blocks_${target}`;
    const currentTargetBlocks = (a as any)[tgtBlocksKey];

    if (srcBlocks != null && shouldWrite(currentTargetBlocks, force)) {
      updates[tgtBlocksKey] = await translateBlocks(srcBlocks, source, target);
    }

    // Layout elements:
    // Meist sind das nur Positionen/IDs -> NICHT übersetzen.
    // Wenn das target leer ist, übernehmen wir es vom source (damit Layout passt).
    const srcLayout = pickSourceJson(a, "layout_elements", source);
    const tgtLayoutKey = `layout_elements_${target}`;
    const currentTargetLayout = (a as any)[tgtLayoutKey];

    if (srcLayout != null && (force || isEmptyJson(currentTargetLayout))) {
      updates[tgtLayoutKey] = srcLayout;
    }

    if (Object.keys(updates).length === 0) {
      return json({ ok: true, message: "Nothing to translate (already filled?)" }, 200);
    }

    const { error: updErr } = await supabaseAdmin.from("articles").update(updates).eq("id", article_id);
    if (updErr) return json({ ok: false, error: "Update failed", details: updErr.message }, 500);

    return json({
      ok: true,
      article_id,
      source_lang: source,
      target_lang: target,
      updated_keys: Object.keys(updates),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // ✅ IMPORTANT: always return JSON so your frontend sees the real error (not just non-2xx)
    return json({ ok: false, error: message }, 500);
  }
});
