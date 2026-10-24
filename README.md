# Assessing Russian Activities and Intentions in Recent US Elections (ICA 2017-01D)

The Intelligence Community Assessment of 6 January 2017, drafted and coordinated by the CIA, the FBI and the NSA and released by the Office of the Director of National Intelligence (ODNI): the declassified version of a highly classified assessment of Russia's influence campaign aimed at the 2016 US presidential election. 25 PDF pages. Source archive and ingestion definition for [Reports that Matter](https://reportsthatmatter.org).

## Scope

The whole PDF ODNI released on 6 January 2017, as one report id, `us-ica-2017-russia-elections`: ODNI's three-page Background note ("The Analytic Process and Cyber Incident Attribution", PDF pp.1-3), then the assessment itself (cover, Scope and Sourcing, Key Judgments, Contents, the CIA/FBI/NSA assessment, Annex A on RT, Annex B on estimative language). The Background note is part of the published file and explains the confidence language the assessment uses.

Out of scope, each a possible later unit: the 2021 assessment "Foreign Threats to the 2020 US Federal Elections" (ICA 2020-00078D), and the 2025 CIA review of the tradecraft behind this assessment.

## Source

`archive/ica-2017-01d.pdf`: the file ODNI published at https://www.dni.gov/files/documents/ICA_2017_01.pdf, taken from the Wayback Machine's capture of the release day (6 January 2017, 21:02 UTC), because dni.gov answers 403 to scripts. 1,589,106 bytes, SHA-256 `5876e67e…2257`. A work of the US government, in the public domain (17 U.S.C. 105). See `datapackage.json`.

## Materials

Checked 2026-10-24 (stage 1 of the preparation pipeline, reportsthatmatter-gqsy.13).

| Need | Source | Role |
| --- | --- | --- |
| Words | ODNI's PDF, SHA-256 `5876e67e…2257` | canonical, citation target, the fidelity check |
| Blocks, headings, lists, emphasis | Wikisource's transcription of the same file (`reference/raw/wikisource-pages.json`, read by `wikisource.ts`) | served structure (`cleanEdition`), aligned word by word to the PDF |
| Notes | One, the asterisk note on Annex A's title (PDF p.16) | Wikisource, aligned to the PDF's note |
| Page anchors | The PDF's printed folios: none on PDF pp.1-5, i-iv on PDF pp.6-9, none on the divider (p.10), 1-14 on PDF pp.11-24 | PDF |
| Annex B (printed p.13) | The PDF prints it as a picture with no text layer; transcribed in `corrections.yaml` from the page image and checked against Wikisource | correction |
| Provenance | ICA 2017-01D, 6 January 2017; Wayback digest `OYERVLH6…` | datapackage |
| Rejected | Wayback captures with digest `N2WCOPXT…` (about 921 KB) | truncated captures of the same file, not a revision |

Sourcing checklist:

1. How the PDF was made: Aspose.Pdf for .NET 10.3.0, created 6 January 2017. Born-digital, Segoe UI and Calibri. Tagged: P 222, H1 68, H2 13, H3 4, LI 91, Table 9, Figure 15, Note 1. The bullets are drawn in a Symbol font whose glyph maps to the private-use character U+F0B7, which the pipeline does not read as a bullet; headings are set by face alone. Image-only text: the cover (p.4), the bar charts (p.21, printed 11), Annex B (p.23, printed 13) and the back cover (p.25). The cover also carries a hidden text layer: a second banner ("This report is a downgraded version of a more sensitive assessment…") under the visible one, and the line "TOP SECRET//HCS-P/SI-G//ORCON/NOFORN/FISA". Neither is printed visibly; both are treated as furniture.
2. Other renditions: the Wikimedia Commons copy is byte-identical. None other found.
3. Official HTML: none; ODNI serves the PDF only.
4. EPUB: none.
5. Wikisource: a complete transcription of this file (pages with text all Validated, 2018-2021), used as the structure source.
6. Court documents: not applicable.
7. US congressional: not applicable (the Senate Intelligence Committee's 2020 report, Volume 4, reviews the assessment; it is not a rendition).
8. Originals: ODNI; the classified version is not public.

Versions: one. Every complete Wayback capture from 2017-01-06 to 2024-09-18 has the same digest as this file.

Layout: a two-line declassification banner heads every page; Background note single column with bullets; the assessment (printed 1-5) in two columns with bulleted sub-paragraphs and bold lead sentences; Annex A single column with photographs and captions at the right; Annex B a full-page image.

## Licence

Text of the report: a work of the US government, in the public domain. The Wikisource transcription in `reference/raw/` is by Wikisource contributors under CC BY-SA 4.0. Our processing code: MIT.

## Build

`ingest.ts` declares how the report is turned into Markdown, and `wikisource.ts` reads the transcription. Rebuild from the site repo with `pnpm ingest run us-ica-2017-russia-elections`. `fidelity.md` lists the stretches where the transcription and the PDF disagree.
