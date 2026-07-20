/** Web: the viewer runs in a same-origin <iframe>. */
import React, {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
import {color} from '@pdf-viewer/styles';
import {encodeShellMessage, parseViewerMessage} from '@pdf-viewer/core';
import type {PdfViewportHandle, PdfViewportProps} from './PdfViewport';

export const PdfViewport = forwardRef<PdfViewportHandle, PdfViewportProps>(
  ({source, visible, onMessage}, ref) => {
    const frame = useRef<HTMLIFrameElement | null>(null);

    useImperativeHandle(ref, () => ({
      post: (type, payload) => {
        // The viewer is same-origin (served from our own bundle), so '*' would
        // work — but pinning the origin keeps the message from leaking if the
        // frame is ever navigated elsewhere.
        frame.current?.contentWindow?.postMessage(
          encodeShellMessage(type, payload),
          window.location.origin,
        );
      },
    }));

    useEffect(() => {
      const listener = (e: MessageEvent) => {
        // Only accept messages from this tab's own frame: several viewports are
        // mounted at once and every one of them sees every window message.
        if (e.source !== frame.current?.contentWindow) {
          return;
        }
        if (e.origin !== window.location.origin) {
          return;
        }
        const m = parseViewerMessage(e.data);
        if (m) {
          onMessage(m);
        }
      };
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    }, [onMessage]);

    return (
      <View
        style={[StyleSheet.absoluteFill, {opacity: visible ? 1 : 0, zIndex: visible ? 1 : 0}]}
        pointerEvents={visible ? 'auto' : 'none'}>
        <iframe
          ref={frame}
          src={source}
          title="PDF document"
          // The iframe is a raw DOM node, so it sits outside react-native-web's
          // flex context: a percentage height would resolve against a parent
          // that has no intrinsic height and collapse to zero. Anchoring it to
          // the absolutely-positioned wrapper's edges gives it real bounds.
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            background: color.docBg,
          }}
        />
      </View>
    );
  },
);
