import React, { useEffect, useRef } from 'react';
import { WebView as RNWebView } from 'react-native-webview';

const WebView: any = RNWebView;
import { globeHtml } from './globeHtml';

export type GlobeProps = {
  geojson: unknown;
  center: [number, number];
  selected: string | null;
  focus?: { center: [number, number]; nonce: number } | null;
  onPin: (id: string) => void;
  onEmpty: () => void;
  scriptBase?: string;
};

// Phone: the globe page runs inside a WebView.
export default function GlobeFrame({ geojson, center, selected, focus, onPin, onEmpty }: GlobeProps) {
  const ref = useRef<any>(null);
  const ready = useRef(false);
  const push = () => {
    if (!ready.current) return;
    ref.current?.postMessage(JSON.stringify({ type: 'data', geojson, center, selected, focus }));
  };
  useEffect(push, [geojson, center[0], center[1], selected, focus?.nonce]);

  return (
    <WebView
      ref={ref}
      originWhitelist={['*']}
      source={{ html: globeHtml(), baseUrl: 'https://localhost/' }}
      style={{ flex: 1, backgroundColor: '#17372A' }}
      javaScriptEnabled
      onMessage={(e: any) => {
        try {
          const d = JSON.parse(e.nativeEvent.data);
          if (d.type === 'ready') { ready.current = true; push(); }
          else if (d.type === 'pin') onPin(d.id);
          else if (d.type === 'empty') onEmpty();
        } catch {}
      }}
    />
  );
}
