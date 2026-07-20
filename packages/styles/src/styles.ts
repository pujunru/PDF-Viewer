/**
 * The shell's stylesheet, expressed against the design tokens.
 *
 * This is consumed unchanged by both shells: on macOS through react-native, on
 * web through react-native-web (which compiles the same objects to CSS). Any
 * rule here that carries a platform caveat is commented at its definition —
 * those comments describe RN-macOS quirks and are why the web build inherits
 * some geometry that looks over-specified for a browser.
 */
import {StyleSheet} from 'react-native';
import {
  color,
  metrics,
  font,
  fontFamily,
  fontWeightSketch,
  sketchCorners,
  sketchTilt,
} from './tokens';

/**
 * Every piece of text in the shell is the sketch face at weight 700 — the
 * design uses no other family and no other weight. Spread into each text style
 * rather than set on a wrapper: react-native does not inherit font properties
 * down the view tree the way CSS does, so a parent-level declaration would
 * silently apply on web and not on macOS.
 */
const sketchText = {fontFamily, fontWeight: fontWeightSketch} as const;

export const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: color.titlebar},

  // Row 1: tabs — the paper the whole sketch sits on.
  //
  // The height is pinned rather than left to the tallest tab. Tabs carry 1.5px
  // strokes and a slight rotation, so an auto height lands on a fraction
  // (54.5px), and a fractional row boundary is antialiased into a visible light
  // seam across the full width where this row meets the dark one below. A whole
  // number keeps that edge clean; the active tab still overflows it downward by
  // 2px (overflow is visible here) to cover the ink rule on the row below.
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: color.titlebar,
    height: 55,
    paddingTop: 12,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  // Lays the tabs out in a row, aligned to the strip's bottom so the active one
  // can hang past it. Deliberately not a ScrollView — see TabBar.tsx.
  tabScroll: {flex: 1, flexDirection: 'row', alignItems: 'flex-end'},
  // Tabs are open-bottomed: no bottom border, so the active one can merge into
  // the mode row. Inactive tabs are outline-only on paper.
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 9,
    marginRight: 8,
    borderWidth: metrics.stroke,
    borderBottomWidth: 0,
    borderColor: color.tabBorder,
    ...sketchCorners.tabInactive(),
    transform: [{rotate: sketchTilt.tabInactive}],
    maxWidth: 240,
  },
  // The active tab's fill IS the mode row's background. Overlapping downward by
  // the row's top border and sitting above it in z-order is what completes the
  // join — without this the two surfaces read as separate bands that merely
  // share a color.
  tabActive: {
    backgroundColor: color.tabActive,
    borderWidth: metrics.strokeHeavy,
    borderBottomWidth: 0,
    borderColor: color.panelBorder,
    ...sketchCorners.tabActive(),
    transform: [{rotate: sketchTilt.tabActive}],
    paddingHorizontal: 17,
    paddingTop: 7,
    paddingBottom: 12,
    marginBottom: -metrics.strokeHeavy,
    zIndex: 2,
  },
  tabText: {...sketchText, color: color.textTab, fontSize: font.tab, marginRight: 8, maxWidth: 180},
  tabTextActive: {color: color.textBright},
  tabClose: {...sketchText, color: color.textTabClose, fontSize: font.glyph, paddingHorizontal: 2},
  // The new-tab affordance is a dashed outline — the sketch convention for
  // "not drawn yet".
  addTab: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: metrics.stroke,
    borderColor: color.textAddTab,
    borderStyle: 'dashed',
    ...sketchCorners.addTab(),
  },
  addTabText: {...sketchText, color: color.textAddTab, fontSize: font.glyph},

  // Row 2: nav / zoom / mode tabs / search. Its background IS the active tab's
  // fill — the first step of the cascade. Height pinned for the same reason as
  // tabBar: the mode tab's 1.5px stroke and rotation would otherwise leave this
  // row's bottom on a half-pixel and antialias it into a seam.
  // Everything in this row is vertically centered. Only the mode tab opts out
  // (alignSelf: 'flex-end') because it alone has to reach the bottom edge to
  // merge into the row below — centering the row and letting that one item
  // escape keeps every other control on a single line automatically, rather
  // than each needing a hand-tuned bottom margin to fake the alignment.
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.toolbar,
    borderTopWidth: metrics.strokeHeavy,
    borderTopColor: color.panelBorder,
    height: 47,
    paddingHorizontal: 16,
    zIndex: 1,
  },
  plainIconBtn: {width: 26, height: 28, justifyContent: 'center', alignItems: 'center'},
  plainIconGlyph: {...sketchText, color: color.textGlyph, fontSize: font.glyphLarge},
  zoomLabel: {
    ...sketchText,
    color: color.textInverse,
    fontSize: font.toolbar,
    marginHorizontal: 6,
    minWidth: 52,
    textAlign: 'center',
  },
  spacer: {flex: 1},

  // Mode tab: text-only when inactive — no chip, no outline, just muted ink on
  // the dark ground.
  annotateTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 14,
  },
  // The active mode's fill IS the tool row's background — the second cascade
  // step. Same merge trick as the document tab: open bottom, overlap the row
  // below by its top border, sit above it in z-order. The border is white here
  // because it is drawn on a dark ground.
  annotateTabActive: {
    backgroundColor: color.surface,
    borderWidth: metrics.strokeHeavy,
    borderBottomWidth: 0,
    borderColor: color.surfaceBorder,
    ...sketchCorners.modeActive(),
    transform: [{rotate: sketchTilt.modeActive}],
    paddingHorizontal: 16,
    // Escapes the row's centering: the merge only works if this reaches the
    // bottom edge and overlaps the row below by its top border.
    alignSelf: 'stretch',
    marginTop: 8,
    marginBottom: -metrics.strokeHeavy,
    zIndex: 2,
  },
  annotateGlyph: {
    ...sketchText,
    color: color.textMuted,
    fontSize: font.toolbar,
    marginRight: 8,
  },
  annotateGlyphActive: {color: color.textBright},
  annotateLabel: {...sketchText, color: color.textMuted, fontSize: font.label},
  annotateLabelActive: {color: color.textBright},
  divider: {width: 1, height: 20, backgroundColor: color.fieldBorder, marginHorizontal: 8},

  // Row 3: annotate tools. Its background IS the active mode's fill, and its
  // top rule is white — the reference draws this divider in paper ink, which
  // is what makes the mode tab above it read as cut out of the row.
  annotateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.surface,
    borderTopWidth: metrics.strokeHeavy,
    borderTopColor: color.surfaceBorder,
    height: 51,
    paddingHorizontal: 18,
  },

  // A dashed pill rather than a filled well — the outline does the work, which
  // is why fieldBg is transparent in the sketched palette.
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.fieldBg,
    borderWidth: metrics.stroke,
    borderColor: color.fieldBorder,
    borderStyle: 'dashed',
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 26,
    width: metrics.searchWidth,
  },
  searchIcon: {...sketchText, color: color.textMuted, fontSize: font.tab, marginRight: 6, lineHeight: 16},
  searchInput: {
    ...sketchText,
    flex: 1,
    color: color.textBright,
    fontSize: font.tab,
    padding: 0,
    margin: 0,
    lineHeight: 16,
    // react-native-web renders TextInput as a real <input>, which brings a UA
    // focus ring the dark field doesn't want.
    outlineStyle: 'none',
  } as any,
  searchCount: {color: color.textMuted, fontSize: 12, marginLeft: 6},
  pageInfo: {...sketchText, color: color.textMuted, fontSize: font.toolbar},

  // Shared icon button
  iconBtnWrap: {position: 'relative'},
  // Inactive tools carry no chip and no outline — just a glyph on the band.
  // A transparent border reserves the box so gaining the active outline
  // doesn't shift the glyph by the border width.
  iconBtn: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
    borderWidth: metrics.strokeHeavy,
    borderColor: 'transparent',
  },
  // Active tool: a white chip in ink, tilted — the one element the reference
  // deliberately tips furthest, so it reads as placed by hand.
  iconBtnHover: {backgroundColor: color.hover},
  iconBtnActive: {
    backgroundColor: color.surfaceRaised,
    borderColor: color.accent,
    ...sketchCorners.chip(),
    transform: [{rotate: sketchTilt.chip}],
  },
  // Glyphs default to paper on the dark band and flip to ink only when the
  // active chip's light fill is behind them.
  iconGlyph: {...sketchText, color: color.textGlyph, fontSize: font.glyph},
  iconGlyphActive: {color: color.textPrimary},
  // The glyph and its mark share a wrapper that hugs the letter, so the fill
  // and rules track the glyph rather than the button box.
  glyphWrap: {alignItems: 'center', justifyContent: 'center'},
  glyphFill: {position: 'absolute', top: -1, bottom: -1, left: -3, right: -3},
  glyphRule: {position: 'absolute', left: -3, right: -3, height: 2},
  // Both rules are positioned from the top of the glyph box: RN-macOS gives
  // the wrapper no slack below the baseline, so a bottom-anchored rule falls
  // outside it and never paints.
  glyphRuleUnder: {top: 16},
  glyphRuleThrough: {top: 8},

  body: {flex: 1, flexDirection: 'row'},
  docArea: {flex: 1, backgroundColor: color.docBg},
  web: {flex: 1, backgroundColor: color.docBg},

  // Tool inspector — a transient card floating over the canvas's top-right
  // corner, rather than a docked sidebar: the tool it configures is itself
  // transient, and the document keeps the full width of the window.
  panel: {
    position: 'absolute',
    top: metrics.panelInset,
    right: metrics.panelInset,
    width: metrics.panelWidth,
    // The card is paper laid over the document, not another dark band — it has
    // to stay readable against the mid-gray gutter behind it.
    backgroundColor: color.surfaceRaised,
    borderWidth: metrics.strokeHeavy,
    borderColor: color.panelBorder,
    ...sketchCorners.card(),
    transform: [{rotate: sketchTilt.card}],
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    // No shadow: the sketch language carries depth with line weight alone, and
    // the ink border is already the heaviest stroke on screen.
    // Above the viewport, which is absolutely positioned within the same area.
    zIndex: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  panelTitle: {...sketchText, color: color.textPrimary, fontSize: font.title},
  panelClose: {...sketchText, color: '#6a6a6c', fontSize: font.close, lineHeight: 18},
  previewBox: {
    backgroundColor: color.surfaceRaised,
    ...sketchCorners.card(),
    borderWidth: metrics.stroke,
    borderColor: color.previewBorder,
    borderStyle: 'dashed',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  // alignSelf keeps the wrapper hugging the word so the highlight bar behind
  // it cannot stretch across the panel.
  previewWordWrap: {alignSelf: 'center', justifyContent: 'center'},
  previewWord: {
    ...sketchText,
    color: color.textPrimary,
    fontSize: font.preview,
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  previewHighlight: {position: 'absolute', top: 4, bottom: 4, left: 0, right: 0},
  previewRule: {position: 'absolute', left: 0, right: 0, height: 2},
  previewRuleUnder: {bottom: 5},
  previewRuleThrough: {top: '50%'},
  panelSectionLabel: {
    ...sketchText,
    color: color.textDim,
    fontSize: font.section,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  panelSwatchRow: {flexDirection: 'row', alignItems: 'center'},
  panelSwatch: {
    width: metrics.iconButton,
    height: metrics.iconButton,
    borderRadius: 15,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: metrics.strokeHeavy,
    borderColor: 'transparent',
  },
  // The swatches are the one place real hue survives, so the selection ring is
  // drawn in ink to stay legible against any of them.
  panelSwatchActive: {borderColor: color.accent},
  panelSwatchFill: {width: 20, height: 20, borderRadius: 10},

  // Font-size stepper. Two drawn buttons around a live value, sharing the
  // swatch row's rhythm so the panel reads as one set of controls.
  panelSectionSpaced: {marginTop: 18},
  stepperRow: {flexDirection: 'row', alignItems: 'center'},
  stepperBtn: {
    width: metrics.iconButton,
    height: metrics.iconButton,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: metrics.stroke,
    borderColor: color.textPrimary,
    ...sketchCorners.chip(),
  },
  stepperBtnOff: {borderColor: color.previewBorder},
  stepperGlyph: {...sketchText, color: color.textPrimary, fontSize: font.glyph},
  stepperValue: {
    ...sketchText,
    color: color.textPrimary,
    fontSize: font.toolbar,
    minWidth: 44,
    textAlign: 'center',
  },
});
