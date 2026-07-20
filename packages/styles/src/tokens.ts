/**
 * Design tokens — the single source of truth for the viewer's look.
 *
 * Every color/metric that used to be hardcoded in App.tsx lives here, so the
 * macOS shell and the web shell cannot drift apart. Consumers pick a
 * projection: `styles.ts` builds react-native StyleSheet objects from these,
 * `css.ts` emits the same values as CSS custom properties for the viewer
 * document (which is plain DOM and cannot import StyleSheet).
 */

/**
 * The warm-gray ramp. Hierarchy is lightness steps of ONE warm gray, never
 * hue — saturated color is reserved for things that map to document content
 * (the annotation palette below).
 *
 * Named by position on the ramp rather than by role, because the cascade
 * (see `level1`/`level2`) deliberately reuses one value in two places: a
 * selected row's fill and the background of the row beneath it are the same
 * color by definition, and role-based names would obscure that identity.
 */
const ramp = {
  ink: '#2b2b28', // darkest — borders, active glyphs
  level1: '#3a3a36', // active document tab === row 2 background
  level2: '#77776f', // active mode tab === row 3 background
  dashOnDark: '#8c8c85',
  mutedOnLight: '#8f8f8a',
  mutedOnDark: '#a3a39d',
  borderInactive: '#b8b8b4',
  textOnDark: '#d5d5d0',
  textOnDarkBright: '#e4e4df',
  glyphOnDark: '#f0f0ec',
  docArea: '#f4f4f2',
  paper: '#fcfcfb',
} as const;

export const color = {
  // Chrome — the grayscale cascade.
  //
  // The mechanic: the selected item in each row IS the background of the row
  // below it. The active tab's fill (`level1`) is row 2's background; the
  // active mode's fill (`level2`) is row 3's background. Selection reads as
  // ink soaking downward, which is why `tabActive` and `toolbar` resolve to
  // the same value — that identity is the design, not a duplication to clean
  // up. The merge is completed in styles.ts, where the active item drops its
  // bottom border and overlaps the row below by the border width.
  titlebar: ramp.paper, // row 1: tab strip — near-white paper
  toolbar: ramp.level1, // row 2: mode tabs — === active tab fill
  tabActive: ramp.level1,
  tabBorder: ramp.borderInactive,

  surface: ramp.level2, // row 3: tools — === active mode fill
  surfaceRaised: ramp.paper, // the active-tool chip, punched out of that band
  surfaceBorder: ramp.paper, // row 3's top rule is white ink on dark ground
  panelBorder: ramp.ink,
  previewBorder: '#c9c9c4',

  // Text
  textPrimary: ramp.ink,
  textInverse: ramp.glyphOnDark,
  textBright: ramp.paper,
  textMuted: ramp.mutedOnDark,
  textDim: ramp.mutedOnLight,
  textTab: ramp.mutedOnLight, // inactive tab labels sit on paper
  textTabClose: '#9a9a95',
  textAddTab: '#9a9a95',
  textGlyph: ramp.glyphOnDark,
  placeholder: ramp.textOnDark,

  // Controls
  // No accent hue: "selected" is a heavier stroke in ink, the way it would be
  // drawn on paper.
  accent: ramp.ink,
  fieldBg: 'transparent', // the search pill is a dashed outline, not a well
  fieldBorder: ramp.dashOnDark,
  hover: ramp.mutedOnDark,

  // Document
  docBg: ramp.docArea,
} as const;

/** Annotation palette — offered by the tool inspector, applied in the viewer. */
export const COLORS = ['#ffd400', '#ff5c5c', '#6cd06c', '#5c9dff', '#c78bff'] as const;

/**
 * Highlights render translucent in the document so glyphs read through them.
 * Toolbar previews reuse the same alpha, so the swatch on screen looks like
 * what lands on the page.
 */
export const HIGHLIGHT_ALPHA = 0.4;
/** The in-document highlight is a touch stronger than its toolbar preview. */
export const HIGHLIGHT_ALPHA_DOC = 0.45;

export const metrics = {
  tabBarHeight: 38,
  toolbarHeight: 44,
  panelWidth: 260,
  /** Inset of the floating tool card from the canvas's top-right corner. */
  panelInset: 16,
  searchWidth: 260,
  iconButton: 30,
  radius: 6,
  radiusField: 7,
  /**
   * Sketched stroke weight. Pencil lines read heavier than the hairline
   * borders of a conventional shell, and a sub-pixel width would defeat the
   * whole look on a 1x display.
   */
  stroke: 1.5,
  strokeHeavy: 2,
} as const;

/**
 * Hand-drawn corners — the exact per-corner radii from the design reference.
 *
 * A real pencil never closes a rectangle at four equal radii, so every sketched
 * container gets *unequal* corners. StyleSheet has no path primitive and
 * react-native-web compiles to plain CSS `border-radius` — per-corner radii are
 * the one lever available, and they are enough: the eye reads the asymmetry as
 * a wobble rather than as a mistake.
 *
 * The `tab*` variants round only their top corners: a merged element's bottom
 * edge is squared off and overlapped into the row below, so bottom radii there
 * would break the join.
 *
 * Functions rather than constants so callers can't share (and then mutate) a
 * single object, and so neighbouring containers can pick different variants —
 * repeating one identical "wobble" everywhere is what makes fake hand-drawing
 * look mechanical.
 */
export const sketchCorners = {
  /** Inactive document tab. */
  tabInactive: () => ({borderTopLeftRadius: 14, borderTopRightRadius: 10}),
  /** Active document tab — merges down into the mode row. */
  tabActive: () => ({borderTopLeftRadius: 11, borderTopRightRadius: 15}),
  /** Active mode tab — merges down into the tool row. */
  modeActive: () => ({borderTopLeftRadius: 12, borderTopRightRadius: 9}),
  /** Active tool chip. */
  chip: () => ({borderTopLeftRadius: 9, borderTopRightRadius: 12, borderBottomRightRadius: 10, borderBottomLeftRadius: 13}),
  /** New-tab button. */
  addTab: () => ({borderTopLeftRadius: 10, borderTopRightRadius: 13, borderBottomRightRadius: 11, borderBottomLeftRadius: 14}),
  /** Page card / floating panel. */
  card: () => ({borderTopLeftRadius: 7, borderTopRightRadius: 10, borderBottomRightRadius: 8, borderBottomLeftRadius: 11}),
} as const;

/**
 * Tiny rotations sell the hand-drawn line more than the radii do. Kept under
 * half a degree everywhere except the active tool chip, which the reference
 * tilts further precisely because it is the one element meant to look placed
 * by hand.
 */
export const sketchTilt = {
  tabInactive: '-0.4deg',
  tabActive: '0.3deg',
  modeActive: '-0.3deg',
  chip: '1.5deg',
  card: '-0.3deg',
} as const;

/**
 * One type scale for the whole shell, at the reference's sizes. A handwriting
 * face has a small x-height and reads lighter than a UI sans at the same
 * nominal size, which is why these all sit 2–3px above conventional chrome
 * text and why weight 700 is the only weight used — see `fontFamily`.
 */
export const font = {
  tab: 16,
  toolbar: 15.5,
  label: 15.5,
  title: 15.5,
  section: 14,
  glyph: 16,
  glyphLarge: 17,
  close: 16,
  status: 14.5,
  /** The tool inspector's specimen word, deliberately oversized. */
  preview: 26,
} as const;

/**
 * The sketch face. Gaegu is the reference's choice — a hand-written Google
 * font. It is declared here with fallbacks rather than bundled: the web shell
 * loads it from Google Fonts (see apps/web/index.html), and any shell that
 * cannot resolve it degrades to the platform UI face rather than to a serif.
 *
 * Weight 700 is the only weight the design uses; the family ships no others.
 */
export const fontFamily =
  "'Gaegu', 'Comic Sans MS', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
export const fontWeightSketch = '700' as const;

/** '#rrggbb' -> 'rgba(r,g,b,a)'. Shared by the shell and the viewer document. */
export function withAlpha(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? '').trim());
  if (!m) {
    return hex;
  }
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}
