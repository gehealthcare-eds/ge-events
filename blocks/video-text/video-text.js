import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function resolveVideoSrc(input) {
  if (!input) return '';

  const str = input.trim();

  const ytMatch = str.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`;
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return `https://www.youtube.com/embed/${str}?autoplay=1&mute=1&loop=1&playlist=${str}`;
  }

  const vimeoMatch = str.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1`;
  }

  return str;
}

export default function decorate(block) {
  const itemRow = block.querySelector(':scope > div');
  if (!itemRow) return;

  const cells = [...itemRow.children];
  const col1 = cells[0];
  const col2 = cells[1];

  const textWrapper = document.createElement('div');
  textWrapper.className = 'video-text-content';

  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-text-media';

  if (col1) {
    moveInstrumentation(col1, textWrapper);

    const content = document.createElement('div');
    content.className = 'video-text-copy';

    const headingEl = col1.querySelector('h1, h2, h3, h4')
      || col1.querySelector('p');

    if (headingEl) {
      const h2 = document.createElement('h2');
      h2.innerHTML = headingEl.innerHTML;
      content.append(h2);
    }

    const bodyClone = col1.cloneNode(true);
    const headingToRemove = bodyClone.querySelector('h1, h2, h3, h4')
      || bodyClone.querySelector('p');
    headingToRemove?.remove();

    const paras = [...bodyClone.querySelectorAll('p')];
    const lastPara = paras[paras.length - 1];
    const ctaAnchor = lastPara?.children.length === 1 && lastPara.querySelector('a[href]')
      ? lastPara.querySelector('a[href]')
      : null;
    if (ctaAnchor) lastPara.remove();

    if (bodyClone.innerHTML.trim()) {
      const desc = document.createElement('div');
      desc.className = 'video-text-description';
      desc.innerHTML = bodyClone.innerHTML;
      content.append(desc);
    }

    if (ctaAnchor) {
      const cta = document.createElement('a');
      cta.className = 'video-text-cta';
      cta.href = ctaAnchor.href;
      cta.textContent = ctaAnchor.textContent.trim() || 'Learn More';
      content.append(cta);
    }

    textWrapper.append(content);
  }

  if (col2) {
    moveInstrumentation(col2, videoWrapper);

    const videoUrlEl = [...col2.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE
        || (n.nodeType === Node.ELEMENT_NODE && !n.querySelector('picture, img')),
    );
    const rawUrl = videoUrlEl?.textContent?.trim() || col2.textContent?.trim() || '';
    const videoSrc = resolveVideoSrc(rawUrl);

    const picture = col2.querySelector('picture');
    const img = col2.querySelector('img');

    if (videoSrc && videoSrc.includes('youtube.com/embed')) {
      const iframe = document.createElement('iframe');
      iframe.src = videoSrc;
      iframe.title = 'Video';
      iframe.loading = 'lazy';
      iframe.setAttribute('allow', 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      videoWrapper.append(iframe);
    } else if (videoSrc && videoSrc.includes('vimeo.com')) {
      const iframe = document.createElement('iframe');
      iframe.src = videoSrc;
      iframe.title = 'Video';
      iframe.loading = 'lazy';
      iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
      iframe.setAttribute('allowfullscreen', '');
      videoWrapper.append(iframe);
    } else if (videoSrc && /\.mp4/.test(videoSrc)) {
      const video = document.createElement('video');
      video.src = videoSrc;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      videoWrapper.append(video);
    } else if (picture) {
      const optimized = createOptimizedPicture(
        img?.src || '',
        img?.alt || '',
        false,
        [{ width: '750' }],
      );
      if (img) moveInstrumentation(img, optimized.querySelector('img'));
      videoWrapper.append(optimized);
    } else if (img) {
      const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
      moveInstrumentation(img, optimized.querySelector('img'));
      videoWrapper.append(optimized);
    }
  }

  moveInstrumentation(itemRow, block);

  block.innerHTML = '';
  block.append(textWrapper, videoWrapper);
}
