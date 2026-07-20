/**
 * The viewer document is plain DOM (pdf.js renders into it directly), so it
 * cannot consume the StyleSheet projection. It gets the same tokens as CSS
 * custom properties instead — one source, two projections.
 */
import {color, HIGHLIGHT_ALPHA_DOC, withAlpha} from './tokens';

/** `:root` custom properties for the viewer document. */
export function viewerCssVars(): string {
  return [
    `--bg: ${color.docBg};`,
    // The sketch shell puts the page on a near-white gutter, so the heavy drop
    // shadow a dark gutter needed would read as dirt. The page is separated by
    // a drawn outline instead, matching the reference's page card.
    `--page-shadow: none;`,
    `--page-border: 1.5px solid ${color.previewBorder};`,
    `--search-hit: ${withAlpha('#ffdc00', 0.45)};`,
    `--search-hit-current: ${withAlpha('#ff9600', 0.75)};`,
    `--selection: ${withAlpha('#0064ff', 0.3)};`,
    `--highlight-alpha: ${HIGHLIGHT_ALPHA_DOC};`,
  ].join('\n    ');
}
