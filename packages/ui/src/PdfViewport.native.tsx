/** macOS/Windows: the viewer runs in a react-native-webview. */
import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {Platform, Text, View, StyleSheet} from 'react-native';
import WebView from 'react-native-webview';
import type {WebViewMessageEvent} from 'react-native-webview/WebViewTypes';
import {styles} from '@pdf-viewer/styles';
import {encodeShellMessage, parseViewerMessage} from '@pdf-viewer/core';
import type {PdfViewportHandle, PdfViewportProps} from './PdfViewport';

/**
 * The macOS WebView is a forwardRef component whose ref is typed `unknown`, so
 * the instance is held by the one capability this component uses.
 */
type WebViewRef = {postMessage: (msg: string) => void};

export const PdfViewport = forwardRef<PdfViewportHandle, PdfViewportProps>(
  ({source, visible, onMessage}, ref) => {
    const web = useRef<WebViewRef | null>(null);
    const [loadError, setLoadError] = useState('');

    useImperativeHandle(ref, () => ({
      post: (type, payload) => {
        web.current?.postMessage(encodeShellMessage(type, payload));
      },
    }));

    const handleMessage = (e: WebViewMessageEvent) => {
      const m = parseViewerMessage(e.nativeEvent.data);
      if (m) {
        onMessage(m);
      }
    };

    return (
      // Inactive tabs stay mounted but transparent, so switching back does not
      // re-render the document from scratch.
      <View
        style={[StyleSheet.absoluteFill, {opacity: visible ? 1 : 0, zIndex: visible ? 1 : 0}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <WebView
          ref={(r: unknown) => {
            web.current = r as WebViewRef | null;
          }}
          // Windows must use the Chromium WebView2 engine: the legacy EdgeHTML
          // WebView runs the ancient Chakra engine (pdf.js needs polyfills for
          // it) and its host<->page message bridge is both injected too late
          // and wired backwards. WebView2 exposes chrome.webview from document
          // start with correct two-way messaging. `useWebView2` is a Windows-only
          // react-native-webview prop and is absent from the macOS-resolved prop
          // type, so it is applied through a spread. macOS ignores it.
          {...(Platform.OS === 'windows' ? ({useWebView2: true} as object) : {})}
          originWhitelist={['*']}
          source={{uri: source}}
          onMessage={handleMessage}
          onError={event => {
            const description = event.nativeEvent.description || 'Unknown WebView error';
            setLoadError(description);
            console.error('[PDF Viewer] WebView navigation failed:', description, source);
          }}
          onLoadStart={() => setLoadError('')}
          // The viewer is loaded from a file:// URL and pulls its siblings
          // (build/*.mjs, web/*, sample.pdf) by relative path, so WebKit has to
          // be granted read access to the directory holding it and permitted to
          // treat those file:// fetches as same-origin.
          allowingReadAccessToURL={source.replace(/\/[^/]*$/, '/')}
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          javaScriptEnabled
          style={styles.web}
        />
        {loadError ? (
          <View style={[StyleSheet.absoluteFill, {backgroundColor: '#f4f4f2'}]}>
            <Text>{`Viewer failed to load: ${loadError}`}</Text>
          </View>
        ) : null}
        {__DEV__ ? (
          <Text style={{position: 'absolute', left: 0, bottom: 0, fontSize: 1, opacity: 0.01}}>
            {`Viewer source: ${source || '<missing>'}`}
          </Text>
        ) : null}
      </View>
    );
  },
);
