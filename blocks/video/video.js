/**
 * Loads and decorates the video block.
 * Supports YouTube, Vimeo, and self-hosted MP4/WebM/OGG video URLs.
 *
 * Expected block structure (one row, two cells):
 *   | Video URL or embed link | Optional caption text |
 *
 * @param {Element} block The block element
 */

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
const VIMEO_REGEX = /vimeo\.com\/(?:video\/)?(\d+)/;

/**
 * Returns true if the URL points to a native video file.
 * @param {string} url
 * @returns {boolean}
 */
function isNativeVideo(url) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

/**
 * Builds a YouTube iframe embed element.
 * @param {string} videoId
 * @param {string} title
 * @returns {HTMLIFrameElement}
 */
function buildYouTubeEmbed(videoId, title) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}`;
  iframe.title = title || 'YouTube video';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  return iframe;
}

/**
 * Builds a Vimeo iframe embed element.
 * @param {string} videoId
 * @param {string} title
 * @returns {HTMLIFrameElement}
 */
function buildVimeoEmbed(videoId, title) {
  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${videoId}`;
  iframe.title = title || 'Vimeo video';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.loading = 'lazy';
  return iframe;
}

/**
 * Builds a native HTML5 <video> element.
 * @param {string} src
 * @param {string} title
 * @returns {HTMLVideoElement}
 */
function buildNativeVideo(src, title) {
  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  if (title) video.setAttribute('aria-label', title);
  return video;
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const [col1, col2] = [...rows[0].children];

  // Resolve the video URL from a raw link or an authored <a> tag
  const anchor = col1?.querySelector('a');
  const videoUrl = (anchor?.href || col1?.textContent?.trim() || '').trim();
  const caption = col2?.textContent?.trim() || '';

  if (!videoUrl) return;

  // Build the wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'video-wrapper';

  // Determine video type and build the media element
  const youtubeMatch = videoUrl.match(YOUTUBE_REGEX);
  const vimeoMatch = videoUrl.match(VIMEO_REGEX);

  let mediaEl;
  if (youtubeMatch) {
    const embedWrapper = document.createElement('div');
    embedWrapper.className = 'video-embed';
    embedWrapper.append(buildYouTubeEmbed(youtubeMatch[1], caption));
    wrapper.append(embedWrapper);
  } else if (vimeoMatch) {
    const embedWrapper = document.createElement('div');
    embedWrapper.className = 'video-embed';
    embedWrapper.append(buildVimeoEmbed(vimeoMatch[1], caption));
    wrapper.append(embedWrapper);
  } else if (isNativeVideo(videoUrl)) {
    mediaEl = buildNativeVideo(videoUrl, caption);
    mediaEl.className = 'video-native';
    wrapper.append(mediaEl);
  } else {
    // Fallback: treat as generic iframe embed (e.g. custom stream URLs)
    const embedWrapper = document.createElement('div');
    embedWrapper.className = 'video-embed';
    const iframe = document.createElement('iframe');
    iframe.src = videoUrl;
    iframe.title = caption || 'Video';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';
    embedWrapper.append(iframe);
    wrapper.append(embedWrapper);
  }

  // Optional caption
  if (caption) {
    const figcaption = document.createElement('p');
    figcaption.className = 'video-caption';
    figcaption.textContent = caption;
    wrapper.append(figcaption);
  }

  block.replaceChildren(wrapper);
}
