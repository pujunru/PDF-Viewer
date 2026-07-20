/** macOS/iOS: the viewer runs in a react-native-webview. */
import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
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
          originWhitelist={['*']}
          source={{uri: source}}
          onMessage={handleMessage}
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
      </View>
    );
  },
);
