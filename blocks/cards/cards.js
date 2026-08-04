import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cols = [...row.children];

    // Move UE instrumentation so the editor can still select/edit each card
    // after the DOM has been restructured (per AEM EDS xwalk best practice).
    const li = document.createElement('li');
    li.className = 'event-card';
    moveInstrumentation(row, li);

    // 4-column layout (grouped via colN_ prefix in the model):
    //   col1 → category (text)
    //   col2 → title (text) + eventInfo (richtext)  [grouped into one cell]
    //   col3 → icon (reference) + background (select) [grouped into one cell]
    //   col4 → link (aem-content)
    const [col1, col2, col3, col4] = cols;

    // col1 — Category
    const category = col1;

    // col2 — Title is the first child element, eventInfo is the rest
    const title = col2;

    // col3 — icon image is the first child, background is plain text
    const icon = col3;
    const bg = col3?.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || '';

    // col4 — link
    const link = col4;

    /* ---------- Background class ---------- */
    if (bg) li.classList.add(`bg-${bg}`);

    /* ---------- Category ---------- */
    if (category?.textContent?.trim()) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'event-category';
      categoryDiv.innerHTML = category.innerHTML;
      li.append(categoryDiv);
    }

    /* ---------- Link wrapper ---------- */
    const authoredLink = link?.querySelector('a');
    const content = document.createElement(authoredLink ? 'a' : 'div');
    content.className = 'event-content';
    if (authoredLink) {
      content.href = authoredLink.href;
      content.title = authoredLink.title || '';
    }

    /* ---------- Title + Info (col2 grouped cell) ---------- */
    if (title) {
      // First paragraph/heading = title, remaining = event info
      const titleClone = title.cloneNode(true);
      const firstPara = titleClone.querySelector('p, h1, h2, h3, h4, h5, h6');
      if (firstPara) {
        const titleDiv = document.createElement('div');
        titleDiv.className = 'event-title';
        titleDiv.textContent = firstPara.textContent.trim();
        content.append(titleDiv);
        firstPara.remove();
      }
      if (titleClone.innerHTML.trim()) {
        const infoDiv = document.createElement('div');
        infoDiv.className = 'event-info';
        infoDiv.innerHTML = titleClone.innerHTML;
        const footer = document.createElement('div');
        footer.className = 'event-footer';
        footer.append(infoDiv);

        /* ---------- Icon (col3 grouped cell) ---------- */
        const img = icon?.querySelector('img');
        if (img) {
          const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '80' }]);
          moveInstrumentation(img, picture.querySelector('img'));
          const iconDiv = document.createElement('div');
          iconDiv.className = 'event-icon';
          iconDiv.append(picture);
          footer.append(iconDiv);
        }

        content.append(footer);
      } else {
        /* Title only — still render icon if present */
        const img = icon?.querySelector('img');
        if (img) {
          const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '80' }]);
          moveInstrumentation(img, picture.querySelector('img'));
          const footer = document.createElement('div');
          footer.className = 'event-footer';
          const iconDiv = document.createElement('div');
          iconDiv.className = 'event-icon';
          iconDiv.append(picture);
          footer.append(iconDiv);
          content.append(footer);
        }
      }
    }

    li.append(content);
    ul.append(li);
  });

  block.replaceChildren(ul);
}
