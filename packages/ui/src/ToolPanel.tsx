import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {styles, withAlpha, HIGHLIGHT_ALPHA, COLORS} from '@pdf-viewer/styles';
import {TOOLS, type Tool} from '@pdf-viewer/core';

/**
 * Right-hand inspector for the active mark-up tool: a live preview of what the
 * tool will produce, plus its color palette.
 */
/** Size range offered by the stepper, in px at 100% zoom. */
const MIN_FONT = 8;
const MAX_FONT = 48;
const FONT_STEP = 2;

export function ToolPanel({
  tool,
  color,
  fontSize,
  onPickColor,
  onPickFontSize,
  onClose,
}: {
  tool: Tool;
  color: string;
  fontSize: number;
  onPickColor: (c: string) => void;
  onPickFontSize: (size: number) => void;
  onClose: () => void;
}) {
  const meta = TOOLS.find(t => t.key === tool);
  if (!meta) {
    return null;
  }
  // The highlight swatch is drawn as a View behind the word rather than a
  // backgroundColor on the Text: on RN-macOS a Text background does not clip
  // to the glyph box and bleeds across the surrounding layout.
  const isHighlight = tool === 'highlight';
  // Underline/strikeout draw their own colored rule, since RN-macOS ignores
  // textDecorationColor.
  const rule = tool === 'underline' ? 'under' : tool === 'strikeout' ? 'through' : null;
  // The text tool's specimen tracks the chosen size as well as the color, so
  // the preview shows what will actually land on the page.
  const wordStyle = [
    styles.previewWord,
    tool === 'ink' || tool === 'freetext' ? {color} : null,
    tool === 'freetext' ? {fontSize} : null,
  ];

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <Text style={styles.panelTitle}>{meta.label} Tool</Text>
        <TouchableOpacity onPress={onClose} hitSlop={8}>
          <Text style={styles.panelClose}>×</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewBox}>
        <View style={styles.previewWordWrap}>
          {isHighlight && (
            <View
              style={[styles.previewHighlight, {backgroundColor: withAlpha(color, HIGHLIGHT_ALPHA)}]}
            />
          )}
          <Text style={wordStyle}>Sample</Text>
          {!!rule && (
            <View
              style={[
                styles.previewRule,
                {backgroundColor: color},
                rule === 'through' ? styles.previewRuleThrough : styles.previewRuleUnder,
              ]}
            />
          )}
        </View>
      </View>

      <Text style={styles.panelSectionLabel}>COLOR</Text>
      <View style={styles.panelSwatchRow}>
        {COLORS.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => onPickColor(c)}
            style={[styles.panelSwatch, color === c && styles.panelSwatchActive]}>
            <View style={[styles.panelSwatchFill, {backgroundColor: c}]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Size only applies to text; the mark-up tools have no type to scale. */}
      {tool === 'freetext' && (
        <>
          <Text style={[styles.panelSectionLabel, styles.panelSectionSpaced]}>SIZE</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              accessibilityLabel="Smaller text"
              disabled={fontSize <= MIN_FONT}
              onPress={() => onPickFontSize(Math.max(MIN_FONT, fontSize - FONT_STEP))}
              style={[styles.stepperBtn, fontSize <= MIN_FONT && styles.stepperBtnOff]}>
              <Text style={styles.stepperGlyph}>－</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{fontSize}</Text>
            <TouchableOpacity
              accessibilityLabel="Larger text"
              disabled={fontSize >= MAX_FONT}
              onPress={() => onPickFontSize(Math.min(MAX_FONT, fontSize + FONT_STEP))}
              style={[styles.stepperBtn, fontSize >= MAX_FONT && styles.stepperBtnOff]}>
              <Text style={styles.stepperGlyph}>＋</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}
