// Printable reports → "Save as PDF" in the browser's print dialog.
// Uses a hidden iframe (no pop-up blockers) and the system fonts, so Marathi
// names print correctly without bundling a PDF library.

export interface ReportColumn {
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
}

export interface ReportOptions {
  title: string;
  subtitle?: string;
  schoolName?: string;
  schoolAddress?: string;
  /** Small key/value facts shown above the table, e.g. "Students: 32". */
  facts?: [string, string][];
  columns: ReportColumn[];
  rows: (string | number | null | undefined)[][];
  /** Text printed under the table (e.g. legend). */
  footnote?: string;
  /** Highlight the first N rows (e.g. top 3 in a merit list). */
  highlightTop?: number;
  landscape?: boolean;
}

const esc = (v: unknown) =>
  String(v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function buildReportHtml(o: ReportOptions): string {
  const now = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const head = o.columns
    .map((c) => `<th style="text-align:${c.align ?? "left"};${c.width ? `width:${c.width};` : ""}">${esc(c.label)}</th>`)
    .join("");
  const body = o.rows
    .map(
      (r, i) =>
        `<tr class="${o.highlightTop && i < o.highlightTop ? "top" : ""}">${r
          .map((v, j) => `<td style="text-align:${o.columns[j]?.align ?? "left"}">${esc(v)}</td>`)
          .join("")}</tr>`,
    )
    .join("");
  const facts = (o.facts ?? []).map(([k, v]) => `<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(o.title)}</title>
<style>
  @page { size: A4 ${o.landscape ? "landscape" : "portrait"}; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Nirmala UI", "Noto Sans Devanagari", Mangal, Arial, sans-serif; color: #0f172a; margin: 0; font-size: 12px; }
  .school { text-align: center; border-bottom: 2px solid #1d4ed8; padding-bottom: 8px; margin-bottom: 12px; }
  .school h1 { font-size: 18px; margin: 0; color: #1e3a8a; }
  .school p { margin: 2px 0 0; color: #475569; font-size: 11px; }
  h2 { font-size: 16px; margin: 0 0 2px; }
  .sub { color: #475569; margin: 0 0 10px; }
  .facts { display: flex; flex-wrap: wrap; gap: 8px 18px; margin: 8px 0 12px; }
  .facts div { background: #f1f5f9; border-radius: 6px; padding: 4px 10px; }
  .facts span { color: #64748b; margin-right: 6px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1e3a8a; color: #fff; font-weight: 600; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  tr.top td { background: #fef3c7 !important; font-weight: 600; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  .foot { margin-top: 10px; color: #64748b; font-size: 10px; display: flex; justify-content: space-between; }
  .sign { margin-top: 36px; display: flex; justify-content: flex-end; }
  .sign div { border-top: 1px solid #94a3b8; padding-top: 4px; width: 160px; text-align: center; color: #475569; }
</style></head><body>
  ${o.schoolName ? `<div class="school"><h1>${esc(o.schoolName)}</h1>${o.schoolAddress ? `<p>${esc(o.schoolAddress)}</p>` : ""}</div>` : ""}
  <h2>${esc(o.title)}</h2>
  ${o.subtitle ? `<p class="sub">${esc(o.subtitle)}</p>` : ""}
  ${facts ? `<div class="facts">${facts}</div>` : ""}
  <table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${o.columns.length}">No data</td></tr>`}</tbody></table>
  <div class="foot"><span>${esc(o.footnote ?? "")}</span><span>Generated ${esc(now)}</span></div>
  <div class="sign"><div>Teacher's signature</div></div>
</body></html>`;
}

/** Open the browser print dialog for a report; the user chooses "Save as PDF". */
export function printReport(o: ReportOptions) {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, { position: "fixed", right: "0", bottom: "0", width: "0", height: "0", border: "0" });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  if (!doc || !iframe.contentWindow) return;
  doc.open();
  doc.write(buildReportHtml(o));
  doc.close();
  const win = iframe.contentWindow;
  const go = () => {
    win.focus();
    win.print();
    window.setTimeout(() => iframe.remove(), 60000);
  };
  // wait for fonts/layout
  if (doc.readyState === "complete") window.setTimeout(go, 250);
  else iframe.onload = () => window.setTimeout(go, 250);
}
