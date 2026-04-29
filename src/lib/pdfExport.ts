import type { NovelProject } from "../types/novel";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function exportProjectToPdf(project: NovelProject): void {
  const chapters = project.chapters
    .map(
      (chapter) => `
        <section class="chapter">
          <h2>${escapeHtml(chapter.title)}</h2>
          ${chapter.sections
            .map(
              (section) => `
                <h3>${escapeHtml(section.title)}</h3>
                <div class="body">${escapeHtml(section.body).replaceAll("\n", "<br />")}</div>
              `,
            )
            .join("")}
        </section>
      `,
    )
    .join("");

  const html = `
    <!doctype html>
    <html lang="ja">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(project.title)}</title>
        <style>
          @page { size: A4; margin: 22mm 18mm; }
          body {
            color: #1f2933;
            font-family: "Yu Mincho", "Hiragino Mincho ProN", serif;
            line-height: 1.9;
          }
          h1 {
            border-bottom: 1px solid #c7d2d9;
            font-size: 24px;
            margin: 0 0 24px;
            padding-bottom: 12px;
          }
          h2 {
            font-size: 18px;
            margin: 0 0 18px;
          }
          h3 {
            font-size: 14px;
            margin: 20px 0 10px;
          }
          .chapter {
            break-after: page;
            page-break-after: always;
          }
          .chapter:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .body {
            font-size: 11.5pt;
            white-space: normal;
          }
        </style>
      </head>
      <body>
        <h1>${escapeHtml(project.title)}</h1>
        ${chapters}
      </body>
    </html>
  `;

  const existingFrame = document.getElementById("pdf-export-frame");
  existingFrame?.remove();

  const frame = document.createElement("iframe");
  frame.id = "pdf-export-frame";
  frame.title = "PDF出力";
  frame.style.height = "0";
  frame.style.left = "-9999px";
  frame.style.position = "fixed";
  frame.style.top = "0";
  frame.style.width = "0";
  let hasPrinted = false;
  frame.onload = () => {
    const frameWindow = frame.contentWindow;
    const frameDocument = frame.contentDocument;
    if (!frameWindow || !frameDocument || hasPrinted) {
      return;
    }

    const hasPrintableContent = frameDocument.body?.textContent?.includes(project.title);
    if (!hasPrintableContent) {
      return;
    }

    hasPrinted = true;
    window.setTimeout(() => {
      frameWindow.focus();
      frameWindow.print();
    }, 50);
  };

  frame.srcdoc = html;
  document.body.appendChild(frame);
}
