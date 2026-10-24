import { cleanEdition, columns, layoutPageJoins, pipeline, romanFolios, runningFurniture, type SplitPage } from "@rtm/ingest";
import { readWikisource } from "./wikisource.ts";

/**
 * How this report is built. Owned by the report: every decision that shaped
 * its text is named here, and the passes it composes are library code.
 *
 * The whole PDF ODNI released on 6 January 2017: its three-page Background
 * note, then the declassified assessment (Scope and Sourcing, Key Judgments,
 * the CIA/FBI/NSA assessment, Annex A on RT, Annex B on estimative language).
 * See README.md for the source and scope.
 *
 * Text and structure come from the Wikisource transcription of this same file
 * (every page with text Validated; wikisource.ts), because the PDF draws its
 * bullets in a Symbol font with no Unicode mapping (U+F0B7, 91 list items),
 * sets its headings by face alone, and prints Annex B (p.13) only as an image.
 * The PDF is the canonical text, the fidelity check and the page anchors.
 */

/**
 * The Background note (PDF pp.2-3) prints its own folios 1 and 2, and the
 * assessment starts again at i and 1. Left as read, the assessment's own pages
 * would be "1#2", "2#2"; the note's two pages are left unnumbered instead, so
 * every page anchor is the assessment's printed number.
 */
function backgroundUnnumbered(): { readonly name: string; readonly stage: "volume"; run(pages: SplitPage[]): SplitPage[] } {
  return {
    name: "backgroundUnnumbered",
    stage: "volume",
    run: (pages) => pages.map((page) => (page.pdfIndex <= 5 ? { ...page, printed: null, roman: undefined } : page)),
  };
}

export default pipeline({
  id: "us-ica-2017-russia-elections",
  title: "Assessing Russian Activities and Intentions in Recent US Elections",
  authors: "Office of the Director of National Intelligence (CIA, FBI and NSA)",
  published_at: "6 January 2017",
  source_url: "https://www.dni.gov/files/documents/ICA_2017_01.pdf",
  repo: ".",
  volumes: [
    {
      path: "archive/ica-2017-01d.pdf",
      sha256: "5876e67e78e92700e57a1e6cf21efeba47840e86b83aaa64353bcc3735f32257",
    },
  ],
  passes: [
    cleanEdition({
      dir: import.meta.dirname,
      files: [{ path: "reference/raw/wikisource-pages.json", sha256: "6b51aecc81659095f838cab5221b346482ac09a0baf62d34840669643cefab16" }],
      notes: "page-foot",
      read: readWikisource,
    }),
    // The shadow (anchors and the fidelity check). Scope and Sourcing to Contents
    // (PDF pp.6-9) are folioed i-iv.
    romanFolios(),
    backgroundUnnumbered(),
    // The declassification banner heads every page (two overlaid variants on the cover, p.4).
    runningFurniture(),
    // The assessment (PDF pp.11-15, printed 1-5) is set in two columns.
    columns(),
    layoutPageJoins(),
  ],
});
