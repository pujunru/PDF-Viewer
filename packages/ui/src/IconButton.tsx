import React, {useState} from 'react';
import {View, Text, TouchableOpacity, type ViewProps} from 'react-native';
import {styles, withAlpha, HIGHLIGHT_ALPHA} from '@pdf-viewer/styles';

export type GlyphMark = 'fill' | 'under' | 'through';

export function IconButton({
  icon,
  label,
  active,
  onPress,
  iconStyle,
  mark,
  markColor,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onPress: () => void;
  iconStyle?: object;
  /**
   * How the glyph previews the tool's effect: a filled block behind it, or a
   * colored rule under / through it — mirroring what the tool draws on a page.
   */
  mark?: GlyphMark;
  markColor?: string;
}) {
  const [hover, setHover] = useState(false);
  // Both RN-macOS and react-native-web forward mouse events on a View, but
  // neither declares them in ViewProps, so the props are cast at the boundary
  // rather than suppressed line-by-line.
  const hoverProps = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
  } as ViewProps;
  return (
    <View style={styles.iconBtnWrap} {...hoverProps}>
      <TouchableOpacity
        onPress={onPress}
        accessibilityLabel={label}
        style={[styles.iconBtn, hover && !active && styles.iconBtnHover, active && styles.iconBtnActive]}>
        <View style={styles.glyphWrap}>
          {mark === 'fill' && (
            <View
              style={[styles.glyphFill, {backgroundColor: withAlpha(markColor || '', HIGHLIGHT_ALPHA)}]}
            />
          )}
          <Text style={[styles.iconGlyph, iconStyle, active && styles.iconGlyphActive]}>{icon}</Text>
          {(mark === 'under' || mark === 'through') && (
            <View
              style={[
                styles.glyphRule,
                {backgroundColor: markColor},
                mark === 'through' ? styles.glyphRuleThrough : styles.glyphRuleUnder,
              ]}
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
