import React from 'react';
import {View} from 'react-native';
import {styles} from '@pdf-viewer/styles';
import {TOOLS, markForTool, type Tool} from '@pdf-viewer/core';
import {IconButton} from './IconButton';

export function AnnotateRow({
  tool,
  color,
  onPickTool,
}: {
  tool: Tool;
  color: string;
  onPickTool: (t: Tool) => void;
}) {
  return (
    <View style={styles.annotateRow}>
      <IconButton
        icon="⌖"
        label="Select"
        active={tool === 'none'}
        onPress={() => onPickTool('none')}
      />
      <View style={styles.divider} />
      {TOOLS.map(tt => (
        <IconButton
          key={tt.key}
          icon={tt.icon}
          label={tt.label}
          active={tool === tt.key}
          // Each mark-up tool previews its own effect on the glyph; ink and
          // freetext draw no mark.
          mark={markForTool(tt.key)}
          markColor={color}
          onPress={() => onPickTool(tt.key)}
        />
      ))}
    </View>
  );
}
