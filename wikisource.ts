import { inlineMarkdown, inlineText, type Edition, type EditionBlock, type EditionNote, type InlinePiece } from "@rtm/ingest";

/**
 * Reads the Wikisource transcription of this PDF (reference/raw/wikisource-pages.json,
 * the MediaWiki API's answer for the Page: namespace of the Commons copy of the same
 * file, one page of wikitext per PDF page, every page with text "Validated") as an
 * edition: headings, paragraphs, bullet lists, bold and italic, the one note, and the
 * contents. The PDF stays the canonical text and supplies the page anchors; this
 * supplies structure, and the words of the one page the PDF prints only as an image
 * (Annex B, PDF p.23, printed 13).
 *
 * What the markup means is a property of this transcription, so the rules below are
 * this report's, each naming the page that needed it.
 */

type ApiPage = { title: string; revisions: Array<{ revid: number; slots: { main: { content: string } } }> };

/**
 * PDF pages left out of the edition: the Background note's cover (1; its title is
 * repeated as the heading on 2), the assessment's cover (4), the blank pages (5, 24),
 * the divider (10; its title is repeated as the heading on 11), the chart page (21: an
 * image only), and the back cover (25).
 */
const SKIP_PAGES = new Set([1, 4, 5, 10, 21, 24, 25]);

/** Annex B's likelihood scale (PDF p.23): the chart's upper and lower rows of terms. */
const SCALE = [
  ["Almost no chance", "Very unlikely", "Unlikely", "Roughly even chance", "Likely", "Very likely", "Almost certainly"],
  ["Remote", "Highly improbable", "Improbable", "Roughly even odds", "Probable", "Highly probable", "Nearly certain"],
];
const SCALE_TABLE = "@@likelihood-scale@@";

export function readWikisource(files: Array<{ path: string; text: string }>): Edition {
  const api = JSON.parse(files[0].text) as { query: { pages: ApiPage[] } };
  const pages = api.query.pages
    .map((p) => ({ n: Number(p.title.split("/").pop()), text: p.revisions[0].slots.main.content }))
    .sort((a, b) => a.n - b.n);

  // ProofreadPage joins transcluded pages with a space, so a paragraph or list item a
  // page break cut ("…victim data" / "obtained in cyber operations…", PDF pp.7-8) reads
  // on; a page that opens on block markup starts a new block.
  let wikitext = "";
  for (const page of pages) {
    if (SKIP_PAGES.has(page.n)) continue;
    let text = page.text.replace(/<noinclude>[\s\S]*?<\/noinclude>/g, "");
    text = dropTemplates(text, ["frame"]); // the declassification banner on every page
    if (page.n === 7) text = dropTemplates(text, ["xxx-larger", "right"]); // the title and "ICA 2017-01D / 6 January 2017" over Key Judgments
    if (page.n === 23) {
      // The likelihood scale is an image in the transcription; its two rows of terms, as the
      // chart prints them left to right, are served as a table (SCALE_TABLE, below).
      text = text.replace(/\[\[File:Verbal scale[^\]]*\]\]/, SCALE_TABLE);
      // The page prints "the Intelligence Community’s judgments"; the transcription has a lower-case i.
      text = text.replace("the intelligence Community’s", "the Intelligence Community’s");
    }
    text = text.replace(/\{\{nop\}\}/g, "").replace(/\{\{smallrefs\}\}/g, "").replace(/\{\{rule\}\}/g, "\n");
    const head = text.replace(/^[ \t]+/, "");
    const block = /^(?:\n|\*|=|\{\{(?:TOC|Image removed))/.test(head) || wikitext.endsWith("\n\n") || /\}\}\s*$/.test(wikitext) || wikitext === "";
    // A list a page break interrupts between items (PDF pp.2-3) stays one list.
    const listRunsOn = head.startsWith("*") && /(?:^|\n)\*[^\n]*\s*$/.test(wikitext);
    wikitext = wikitext.replace(/\s+$/, "") + (listRunsOn ? "\n" : block ? "\n\n" : " ") + head.replace(/^\n+/, "");
  }

  const blocks: EditionBlock[] = [];
  const notes: EditionNote[] = [];
  const source = { file: files[0].path };
  const push = (b: EditionBlock) => blocks.push({ ...b, source });

  // Annex titles: "== Annex A ==" over "=== ''Russia'' -- Kremlin's TV …<ref>…</ref> ===" (PDF p.16)
  // and "== Annex B ==" over "=== ESTIMATIVE LANGUAGE ===" (p.23) are one heading each, as the
  // contents prints them ("A: Russia—Kremlin's TV…", "B: Estimative Language").
  wikitext = wikitext
    .replace(/==\s*Annex A\s*==\s*\n===\s*(.*?)\s*===/, (_, t) => `== Annex A: ${t} ==`)
    .replace(/==\s*Annex B\s*==\s*\n+===\s*ESTIMATIVE LANGUAGE\s*===/, "== Annex B: Estimative Language ==");

  let inContents = false;
  let list: string[] | null = null;
  const flush = () => {
    if (list) push({ kind: "list", items: list });
    list = null;
  };
  const inline = (s: string) => inlineMarkdown(pieces(s, notes));

  for (const chunk of wikitext.split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter((l) => l !== "");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const heading = line.match(/^(={2,4})\s*(.*?)\s*\1$/);
      if (heading) {
        flush();
        const title = inline(heading[2]);
        // The contents' own group titles (PDF p.9, "CIA/FBI/NSA Assessment: …", "Annexes") are lines of the contents, not sections.
        if (heading[1].length === 2) inContents = title === "Contents";
        else if (inContents) {
          push({ kind: "paragraph", text: title });
          continue;
        }
        push({ kind: "heading", level: heading[1].length, text: title });
        continue;
      }
      if (line === SCALE_TABLE) {
        flush();
        push({ kind: "table", header: false, rows: SCALE });
        continue;
      }
      if (line.startsWith("{{TOC begin") || line.startsWith("{{TOC end")) continue;
      const toc = line.match(/^\{\{TOC row (?:2-1|1-1-1)\|(.*)\}\}$/);
      if (toc) {
        flush();
        const cells = splitTemplateArgs(toc[1]);
        const page = cells.pop()!.trim();
        push({ kind: "contents", text: inline(cells.join(" ")), page });
        continue;
      }
      const caption = line.match(/^\{\{Image removed\|(.*)\}\}$/);
      if (caption) {
        // A photograph's caption (Annex A, PDF pp.16-19); the photograph itself is not reproduced.
        flush();
        push({ kind: "paragraph", text: inline(caption[1]), float: true });
        continue;
      }
      if (line.startsWith("*")) {
        list ??= [];
        list.push(inline(line.replace(/^\*\s*/, "")));
        continue;
      }
      // A paragraph: this line and the ones after it up to the next list item or heading
      // (a hard line break inside a paragraph, PDF p.2 "foreign / activities").
      flush();
      let text = line;
      while (i + 1 < lines.length && !/^(?:\*|=|\{\{)/.test(lines[i + 1])) text += " " + lines[++i];
      push({ kind: "paragraph", text: inline(text) });
    }
    flush();
  }
  return { blocks, notes };
}

/** Removes every `{{name|…}}` template (balanced braces) of the given names. */
function dropTemplates(text: string, names: string[]): string {
  for (const name of names) {
    let at: number;
    while ((at = text.indexOf(`{{${name}|`)) !== -1) {
      const end = closeOf(text, at);
      text = text.slice(0, at) + text.slice(end).replace(/^\n/, "");
    }
  }
  return text;
}

/** The index just past the `}}` that closes the template opening at `at`. */
function closeOf(text: string, at: number): number {
  let depth = 0;
  for (let i = at; i < text.length - 1; i++) {
    if (text.startsWith("{{", i)) {
      depth++;
      i++;
    } else if (text.startsWith("}}", i)) {
      depth--;
      i++;
      if (depth === 0) return i + 1;
    }
  }
  throw new Error(`wikisource: unclosed template at ${text.slice(at, at + 40)}`);
}

/** Splits a template's arguments on top-level `|` (not inside `[[…]]` or `{{…}}`). */
function splitTemplateArgs(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === "[[" || two === "{{") {
      depth++;
      cur += two;
      i++;
    } else if (two === "]]" || two === "}}") {
      depth--;
      cur += two;
      i++;
    } else if (s[i] === "|" && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += s[i];
  }
  out.push(cur);
  return out;
}

/** Inline wikitext → pieces: links and simple templates to their text, `<ref>` to a note marker, apostrophe runs to emphasis. */
function pieces(s: string, notes: EditionNote[]): InlinePiece[] {
  s = s
    .replace(/\[\[File:[^\]]*\]\]/g, "")
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, "$1")
    .replace(/\[\[([^\]]*)\]\]/g, "$1")
    .replace(/\{\{anchor\+\|[^|}]*\|([^}]*)\}\}/g, "$1")
    .replace(/\{\{n\|([^}]*)\}\}/g, "$1")
    .replace(/\{\{!\}\}/g, "|")
    .replace(/\{\{gap\}\}/g, " ")
    .replace(/<br\s*\/?>/g, " ");
  if (/\{\{|\}\}/.test(s)) throw new Error(`wikisource: unhandled template in ${s.slice(0, 80)}`);
  const out: InlinePiece[] = [];
  let strong = false;
  let em = false;
  const text = (t: string) => {
    if (t) out.push({ text: t, ...(strong ? { strong: true } : {}), ...(em ? { em: true } : {}) });
  };
  const re = /'{5}|'{3}|'{2}|<ref>([\s\S]*?)<\/ref>/g;
  let last = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(s)); ) {
    text(s.slice(last, m.index));
    last = re.lastIndex;
    if (m[1] !== undefined) {
      // The one note, on Annex A's title (PDF p.16), which the PDF marks with an asterisk; the site numbers notes, so it is note 1.
      const label = "1";
      notes.push({ label, text: inlineText(pieces(m[1], notes)) });
      out.push({ marker: label });
    } else if (m[0].length === 5) {
      strong = !strong;
      em = !em;
    } else if (m[0].length === 3) strong = !strong;
    else em = !em;
  }
  text(s.slice(last));
  return out;
}
