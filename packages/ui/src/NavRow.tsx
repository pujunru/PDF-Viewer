import React from 'react';
import {View, Text, TextInput, TouchableOpacity} from 'react-native';
import {styles, color as tokens} from '@pdf-viewer/styles';

export function NavRow({
  zoomPct,
  onZoomIn,
  onZoomOut,
  annotateOpen,
  onToggleAnnotate,
  query,
  onChangeQuery,
  onSubmitQuery,
  searchInfo,
  onSearchStep,
  statusText,
}: {
  zoomPct: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  annotateOpen: boolean;
  onToggleAnnotate: () => void;
  query: string;
  onChangeQuery: (s: string) => void;
  onSubmitQuery: () => void;
  searchInfo: {current: number; total: number};
  onSearchStep: (dir: 1 | -1) => void;
  statusText: string;
}) {
  return (
    <View style={styles.navRow}>
      <Text style={styles.zoomLabel}>{Math.round(zoomPct ?? 100)}% ▾</Text>
      <TouchableOpacity style={styles.plainIconBtn} onPress={onZoomOut}>
        <Text style={styles.plainIconGlyph}>－</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.plainIconBtn} onPress={onZoomIn}>
        <Text style={styles.plainIconGlyph}>＋</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <TouchableOpacity
        style={[styles.annotateTab, annotateOpen && styles.annotateTabActive]}
        onPress={onToggleAnnotate}>
        <Text style={[styles.annotateGlyph, annotateOpen && styles.annotateGlyphActive]}>A</Text>
        <Text style={[styles.annotateLabel, annotateOpen && styles.annotateLabelActive]}>
          Annotate
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={tokens.placeholder}
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={onSubmitQuery}
        />
        {searchInfo.total > 0 && (
          <Text style={styles.searchCount}>
            {searchInfo.current}/{searchInfo.total}
          </Text>
        )}
      </View>
      <TouchableOpacity style={styles.plainIconBtn} onPress={() => onSearchStep(-1)}>
        <Text style={styles.plainIconGlyph}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.plainIconBtn} onPress={() => onSearchStep(1)}>
        <Text style={styles.plainIconGlyph}>›</Text>
      </TouchableOpacity>

      <View style={{width: 14}} />
      <Text style={styles.pageInfo}>{statusText}</Text>
    </View>
  );
}
