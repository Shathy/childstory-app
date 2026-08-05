/**
 * Builds the HTML used to render the story into PDF via Puppeteer.
 * The browser engine handles Arabic shaping + RTL bidi automatically
 * through `direction: rtl` and a proper Arabic web font — no manual
 * reshaping needed.
 */
export function buildStoryHtml(story: any): string {
  const rtl = story.language === 'ar';
  const pagesHtml = story.story_pages
    .map(
      (page: any) => `
      <section class="page">
        <div class="illustration">
          ${
            page.image_url && !page.image_url.includes('placeholder')
              ? `<img src="${page.image_url}" alt="" />`
              : `<div class="placeholder">🎨</div>`
          }
        </div>
        <p class="text">${escapeHtml(page.text_content)}</p>
      </section>`,
    )
    .join('\n');

  return `
<!DOCTYPE html>
<html lang="${story.language}" dir="${rtl ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: ${rtl ? "'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif" : "'Helvetica Neue', Arial, sans-serif"};
    margin: 0;
  }
  .cover {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
  }
  .cover h1 { font-size: 40px; margin-bottom: 12px; }
  .page {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 48px;
    page-break-after: always;
  }
  .illustration {
    width: 100%;
    max-width: 500px;
    height: 320px;
    background: #f2f2f2;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .illustration img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; }
  .placeholder { font-size: 48px; opacity: 0.3; }
  .text { font-size: 22px; line-height: 1.8; text-align: center; max-width: 600px; }
</style>
</head>
<body>
  <div class="cover">
    <h1>${escapeHtml(story.title ?? story.child_name)}</h1>
  </div>
  ${pagesHtml}
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
