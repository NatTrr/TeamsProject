import React, { useEffect, useMemo, useRef } from 'react';
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

// Chrome: the globe page runs inside an iframe.
export default function GlobeFrame({ geojson, center, selected, focus, onPin, onEmpty, scriptBase }: GlobeProps) {
  const ref = useRef<HTMLIFrameElement | null>(null);
  const ready = useRef(false);
  const latest = useRef({ geojson, center, selected, focus });
  latest.current = { geojson, center, selected, focus };
  const cb = useRef({ onPin, onEmpty });
  cb.current = { onPin, onEmpty };

  // A blob URL (not srcDoc): MapLibre's background worker does not start inside a srcDoc iframe.
  const url = useMemo(() => URL.createObjectURL(new Blob([globeHtml(scriptBase)], { type: 'text/html' })), [scriptBase]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  const push = () => {
    const w = ref.current?.contentWindow;
    if (!w || !ready.current) return;
    w.postMessage(JSON.stringify({ type: 'data', ...latest.current }), '*');
  };

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return;
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'ready') { ready.current = true; push(); }
        else if (d.type === 'pin') cb.current.onPin(d.id);
        else if (d.type === 'empty') cb.current.onEmpty();
      } catch {}
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(push, [geojson, center[0], center[1], selected, focus?.nonce]);

  return React.createElement('iframe', {
    ref,
    src: url,
    title: 'Map',
    style: { border: 0, width: '100%', height: '100%', display: 'block', background: '#17372A' },
  });
}
