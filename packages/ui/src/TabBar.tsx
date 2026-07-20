import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {styles} from '@pdf-viewer/styles';
import type {Tab} from '@pdf-viewer/core';

export function TabBar({
  tabs,
  activeId,
  onSelect,
  onClose,
  onAdd,
}: {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <View style={styles.tabBar}>
      {/* The active tab overflows this row by 2px to cover the ink rule below
          it — a horizontal ScrollView clips vertically, which would cut that
          overflow off and leave the rule drawn straight through the merge, so
          the tabs are laid out directly. */}
      <View style={styles.tabScroll}>
        {tabs.map(t => (
          <TouchableOpacity
            key={t.id}
            onPress={() => onSelect(t.id)}
            style={[styles.tab, t.id === activeId && styles.tabActive]}>
            <Text
              numberOfLines={1}
              style={[styles.tabText, t.id === activeId && styles.tabTextActive]}>
              {t.dirty ? '• ' : ''}
              {t.title}
            </Text>
            <TouchableOpacity onPress={() => onClose(t.id)} hitSlop={8}>
              <Text style={styles.tabClose}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onAdd} style={styles.addTab}>
          <Text style={styles.addTabText}>＋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
