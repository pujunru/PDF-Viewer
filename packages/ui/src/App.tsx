/**
 * PDF Viewer — the application shell, shared by every platform.
 *
 * Tabs + toolbar + one viewport per document. Everything platform-specific is
 * injected: how files are picked (`files`) and where the viewer document lives
 * (`viewerUrl`). The macOS and web entry points differ only in what they pass
 * here.
 */
import React, {useCallback, useRef, useState} from 'react';
import {SafeAreaView, View} from 'react-native';
import {styles, COLORS} from '@pdf-viewer/styles';
import {
  BASE_SCALE,
  SAMPLE_DOC,
  closeTab as closeTabIn,
  newTab,
  patchTab,
  type FileService,
  type Tab,
  type Tool,
  type ViewerMessage,
} from '@pdf-viewer/core';
import {TabBar} from './TabBar';
import {NavRow} from './NavRow';
import {AnnotateRow} from './AnnotateRow';
import {ToolPanel} from './ToolPanel';
import {PdfViewport, type PdfViewportHandle} from './PdfViewport';

export type AppProps = {
  /** Platform file picker / writer. */
  files: FileService;
  /** URL of the viewer document (bundle file:// on macOS, path on web). */
  viewerUrl: string;
};

export default function App({files, viewerUrl}: AppProps): React.JSX.Element {
  const [tabs, setTabs] = useState<Tab[]>([newTab()]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const [tool, setTool] = useState<Tool>('none');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [fontSize, setFontSize] = useState(16);
  const [query, setQuery] = useState('');
  const [searchInfo, setSearchInfo] = useState({current: 0, total: 0});
  const [annotateOpen, setAnnotateOpen] = useState(false);
  const viewports = useRef<Record<string, PdfViewportHandle | null>>({});

  const active = tabs.find(t => t.id === activeId)!;

  const send = useCallback(
    (type: string, payload: unknown = {}) => {
      viewports.current[activeId]?.post(type, payload);
    },
    [activeId],
  );

  const patch = (id: string, p: Partial<Tab>) => setTabs(ts => patchTab(ts, id, p));

  // Tabs hold their bytes until their viewer signals ready; a tab that has
  // never been given a file shows the bundled sample.
  const loadIntoViewport = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    viewports.current[tabId]?.post('load', {base64: tab?.pendingBase64 ?? SAMPLE_DOC});
  };

  const onViewerMessage = (tabId: string) => (m: ViewerMessage) => {
    switch (m.type) {
      case 'ready':
        loadIntoViewport(tabId);
        break;
      case 'loaded':
        patch(tabId, {pageCount: m.payload.pageCount, ready: true, dirty: false});
        break;
      case 'dirty':
        patch(tabId, {dirty: !!m.payload.dirty});
        break;
      case 'search':
        setSearchInfo({current: m.payload.current, total: m.payload.total});
        break;
      case 'zoom':
        patch(tabId, {zoomPct: Math.round((m.payload.scale / BASE_SCALE) * 100)});
        break;
      // Selecting a box adopts its color/size as the panel's current values, so
      // the controls show what they are about to change.
      case 'textSelection':
        if (m.payload.selected) {
          if (m.payload.color) {
            setColor(m.payload.color);
          }
          if (m.payload.size) {
            setFontSize(m.payload.size);
          }
        }
        break;
    }
  };

  const closeTab = (id: string) => {
    delete viewports.current[id];
    setTabs(ts => {
      const next = closeTabIn(ts, id, activeId);
      setActiveId(next.activeId);
      return next.tabs;
    });
  };

  // "+" opens the platform file dialog; a new tab is only created once a PDF is
  // actually chosen (cancelling the dialog leaves tabs untouched).
  const addTab = async () => {
    const picked = await files.openPDF();
    if (!picked) {
      return; // user cancelled
    }
    const t = newTab({
      title: picked.name,
      path: picked.path,
      pendingBase64: picked.base64,
    });
    setTabs(ts => [...ts, t]);
    setActiveId(t.id);
  };

  const pickTool = (t: Tool) => {
    const next = tool === t ? 'none' : t;
    setTool(next);
    send('setTool', {tool: next, color});
  };
  const pickColor = (c: string) => {
    setColor(c);
    // setTool carries the color for new marks; setColor additionally restyles a
    // selected text box, which is a no-op when nothing is selected.
    send('setTool', {tool, color: c});
    send('setColor', {color: c});
  };
  const pickFontSize = (size: number) => {
    setFontSize(size);
    send('setFontSize', {size});
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Row 1: tabs */}
      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSelect={setActiveId}
        onClose={closeTab}
        onAdd={addTab}
      />

      {/* Row 2: view mode / zoom / annotate / search */}
      <NavRow
        zoomPct={active.zoomPct}
        onZoomIn={() => send('zoomIn')}
        onZoomOut={() => send('zoomOut')}
        annotateOpen={annotateOpen}
        onToggleAnnotate={() => setAnnotateOpen(o => !o)}
        query={query}
        onChangeQuery={setQuery}
        onSubmitQuery={() => send('search', {term: query})}
        searchInfo={searchInfo}
        onSearchStep={dir => send('searchStep', {dir})}
        statusText={active.ready ? `${active.pageCount} pages` : 'Loading…'}
      />

      {/* Row 3: annotate tools — only when Annotate is toggled on */}
      {annotateOpen && <AnnotateRow tool={tool} color={color} onPickTool={pickTool} />}

      {/* The document fills the remaining height; the tool inspector floats
          over its top-right corner rather than taking width from it. */}
      <View style={styles.body}>
        <View style={styles.docArea}>
          {tabs.map(t => (
            <PdfViewport
              key={t.id}
              ref={r => {
                viewports.current[t.id] = r;
              }}
              source={viewerUrl}
              visible={t.id === activeId}
              onMessage={onViewerMessage(t.id)}
            />
          ))}

          {annotateOpen && tool !== 'none' && (
            <ToolPanel
              tool={tool}
              color={color}
              fontSize={fontSize}
              onPickColor={pickColor}
              onPickFontSize={pickFontSize}
              onClose={() => pickTool('none')}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
