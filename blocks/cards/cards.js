import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');

  [...block.children].forEach((row) => {
    const cols = [...row.children];

    const li = document.createElement('li');
    li.className = 'event-card';
    moveInstrumentation(row, li);

    const [col1, col2, col3, col4] = cols;

    const category = col1;
    const title = col2;
    const icon = col3;
    const bg = col3?.textContent?.trim().toLowerCase().replace(/\s+/g, '-') || '';
    const link = col4;

    if (bg) li.classList.add(`bg-${bg}`);

    if (category?.textContent?.trim()) {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'event-category';
      categoryDiv.innerHTML = category.innerHTML;
      li.append(categoryDiv);
    }

    const authoredLink = link?.querySelector('a');
    const content = document.createElement(authoredLink ? 'a' : 'div');
    content.className = 'event-content';
    if (authoredLink) {
      content.href = authoredLink.href;
      content.title = authoredLink.title || '';
    }

    if (title) {
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
