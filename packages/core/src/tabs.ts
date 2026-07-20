/**
 * Tab-list transitions, kept out of the shells so macOS and web behave
 * identically. Pure functions over the list — the shells hold it in useState.
 */
import {newTab, type Tab} from './types';

export function patchTab(tabs: Tab[], id: string, patch: Partial<Tab>): Tab[] {
  return tabs.map(t => (t.id === id ? {...t, ...patch} : t));
}

/**
 * Closing the last tab leaves a fresh sample tab rather than an empty window,
 * so the shell always has an `active` tab to render.
 */
export function closeTab(
  tabs: Tab[],
  id: string,
  activeId: string,
): {tabs: Tab[]; activeId: string} {
  const idx = tabs.findIndex(t => t.id === id);
  const next = tabs.filter(t => t.id !== id);
  if (next.length === 0) {
    const fresh = newTab();
    return {tabs: [fresh], activeId: fresh.id};
  }
  // Closing the active tab falls back to its left neighbour.
  const nextActive = id === activeId ? next[Math.max(0, idx - 1)].id : activeId;
  return {tabs: next, activeId: nextActive};
}
