/*
 * Video Text Block
 *
 * Parent model (video-text): classes – layout variant (video-left / video-right / dark / light)
 *
 * Child row (video-text-item) – single item, two columns:
 *   col1: heading (text) + text (richtext) + cta link + cta text
 *   col2: videoUrl (text) + videoThumbnail (reference) + videoThumbnailAlt (text)
 *
 * The block always contains exactly ONE video-text-item child row.
 */

import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Extract a YouTube/Vimeo video ID or return an MP4 URL as-is.
 * Handles bare IDs, full youtube.com URLs, youtu.be short URLs, vimeo URLs.
 */
function resolveVideoSrc(input) {
  if (!input) return '';

  const str = input.trim();

  // youtube.com/watch?v=ID or /embed/ID
  const ytMatch = str.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const id = ytMatch[1];
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`;
  }

  // Bare YouTube ID (11 alphanum chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return `https://www.youtube.com/embed/${str}?autoplay=1&mute=1&loop=1&playlist=${str}`;
  }

  // Vimeo
  const vimeoMatch = str.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1`;
  }

  // MP4 / direct URL — return as-is for <video> usage
  return str;
}

export default function decorate(block) {
  // The block has one child row = the video-text-item.
  // That row has two cells: col1 (text content) and col2 (video).
  const itemRow = block.querySelector(':scope > div');
  if (!itemRow) return;

  const cells = [...itemRow.children];
  const col1 = cells[0]; // text side
  const col2 = cells[1]; // video side

  // Build the two-panel layout
  const textWrapper = document.createElement('div');
  textWrapper.className = 'video-text-content';

  const videoWrapper = document.createElement('div');
  videoWrapper.className = 'video-text-media';

  // --- Text side (col1) ---
  if (col1) {
    // Move UE instrumentation from the item row's first cell so authors
    // can click the text panel and edit heading / text / CTA in UE.
    moveInstrumentation(col1, textWrapper);

    const content = document.createElement('div');
    content.className = 'video-text-copy';

    // Heading: first heading element OR first <p> promoted to h2.
    // AEM xwalk text fields render as <p>, so we always promote the first
    // paragraph to h2 when no explicit heading tag is present.
    const headingEl = col1.querySelector('h1, h2, h3, h4')
      || col1.querySelector('p');

    if (headingEl) {
      const h2 = document.createElement('h2');
      h2.innerHTML = headingEl.innerHTML;
      content.append(h2);
    }

    // Body text: clone col1, remove the heading element (whichever was used)
    const bodyClone = col1.cloneNode(true);
    // Remove the first h1-h4 if present, else remove the first <p> (used as heading)
    const headingToRemove = bodyClone.querySelector('h1, h2, h3, h4')
      || bodyClone.querySelector('p');
    headingToRemove?.remove();

    // Strip the CTA link paragraph (last <p> containing only a link)
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

    // CTA
    if (ctaAnchor) {
      const cta = document.createElement('a');
      cta.className = 'video-text-cta';
      cta.href = ctaAnchor.href;
      cta.textContent = ctaAnchor.textContent.trim() || 'Learn More';
      content.append(cta);
    }

    textWrapper.append(content);
  }

  // --- Video side (col2) ---
  if (col2) {
    // Move UE instrumentation from col2 so authors can edit video fields in UE.
    moveInstrumentation(col2, videoWrapper);

    // Video URL is the text content of the first element that isn't an image
    const videoUrlEl = [...col2.childNodes].find(
      (n) => n.nodeType === Node.TEXT_NODE
        || (n.nodeType === Node.ELEMENT_NODE && !n.querySelector('picture, img')),
    );
    const rawUrl = videoUrlEl?.textContent?.trim() || col2.textContent?.trim() || '';
    const videoSrc = resolveVideoSrc(rawUrl);

    // Thumbnail image (optional)
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
      // No video URL — use thumbnail image
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

  // Move UE instrumentation from the item row to the block itself
  // so authors can click the whole block to add/edit the item.
  moveInstrumentation(itemRow, block);

  block.innerHTML = '';
  block.append(textWrapper, videoWrapper);
}
