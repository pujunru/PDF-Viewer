/**
 * Guards the properties that make "one codebase, two shells" true, rather than
 * re-testing what App.test.tsx already renders.
 */
import 'react-native';
import {describe, it, expect} from '@jest/globals';

import {closeTab, patchTab, newTab, markForTool, TOOLS} from '@pdf-viewer/core';
import {styles, COLORS, withAlpha} from '@pdf-viewer/styles';

describe('shared tab logic', () => {
  it('closing the last tab leaves a fresh one, so the shell always has an active tab', () => {
    const only = newTab();
    const next = closeTab([only], only.id, only.id);
    expect(next.tabs).toHaveLength(1);
    expect(next.tabs[0].id).not.toBe(only.id);
    expect(next.activeId).toBe(next.tabs[0].id);
  });

  it('closing the active tab activates its left neighbour', () => {
    const [a, b, c] = [newTab(), newTab(), newTab()];
    const next = closeTab([a, b, c], b.id, b.id);
    expect(next.tabs.map(t => t.id)).toEqual([a.id, c.id]);
    expect(next.activeId).toBe(a.id);
  });

  it('closing an inactive tab keeps the current selection', () => {
    const [a, b] = [newTab(), newTab()];
    expect(closeTab([a, b], a.id, b.id).activeId).toBe(b.id);
  });

  it('patchTab touches only the addressed tab', () => {
    const [a, b] = [newTab(), newTab()];
    const next = patchTab([a, b], b.id, {dirty: true});
    expect(next[0].dirty).toBe(false);
    expect(next[1].dirty).toBe(true);
  });
});

describe('shared styling', () => {
  it('every tool has a toolbar entry, and only text markup previews a mark', () => {
    expect(TOOLS.map(t => t.key)).toEqual([
      'highlight',
      'underline',
      'strikeout',
      'ink',
      'freetext',
    ]);
    expect(markForTool('highlight')).toBe('fill');
    expect(markForTool('underline')).toBe('under');
    expect(markForTool('strikeout')).toBe('through');
    expect(markForTool('ink')).toBeUndefined();
    expect(markForTool('none')).toBeUndefined();
  });

  it('withAlpha converts palette hex to rgba and passes non-hex through', () => {
    expect(withAlpha('#ffd400', 0.4)).toBe('rgba(255, 212, 0, 0.4)');
    expect(withAlpha('rgba(1,2,3,1)', 0.4)).toBe('rgba(1,2,3,1)');
    // Every offered color must survive the conversion the previews rely on.
    for (const c of COLORS) {
      expect(withAlpha(c, 0.4)).toMatch(/^rgba\(\d+, \d+, \d+, 0\.4\)$/);
    }
  });

  it('the stylesheet resolves, so both shells render from the same rules', () => {
    // StyleSheet.create returns registered styles; a missing key would mean a
    // component silently renders unstyled on one platform.
    for (const key of ['root', 'tabBar', 'navRow', 'annotateRow', 'panel', 'docArea']) {
      expect(styles[key as keyof typeof styles]).toBeDefined();
    }
  });
});
