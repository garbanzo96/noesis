import React from 'react';
import ReactDOM from 'react-dom/client';
import 'katex/dist/katex.min.css';
import '@fontsource/orbitron/latin-600.css';
import '@fontsource/orbitron/latin-800.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import './styles/game.css';
import './styles/v5.css';
import './styles/screens-mobile.css';
import { GameRoot } from './game/GameRoot';
import { CastGallery } from './game/dev/CastGallery';
import { TexLab } from './game/dev/TexLab';
import { LEVELS } from './content/registry';
import { audioTap, music, sfx } from './game/audio';

if (import.meta.env.DEV || import.meta.env.MODE === 'qa') {
  // level index for the QA scripts (qa/overlap.mjs)
  (window as unknown as { __levels: unknown }).__levels = Object.values(LEVELS).map((l) => ({
    id: l.id,
    steps: l.steps.map((s) => s.kind),
    rounds: l.steps.map((s) => (s.kind === 'challenge' ? s.rounds : 0)),
  }));
  (window as unknown as { __audio: unknown }).__audio = { music, sfx, tap: audioTap };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {import.meta.env.DEV && window.location.hash === '#/dev/cast' ? (
      <CastGallery />
    ) : import.meta.env.DEV && window.location.hash === '#/dev/tex' ? (
      <TexLab />
    ) : (
      <GameRoot />
    )}
  </React.StrictMode>,
);
