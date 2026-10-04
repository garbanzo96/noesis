import { useTween } from '../../engine/hooks';
import { RANKS, RANK_XP, rankOf, useGame } from '../state';
import { NoesisEye } from './NoesisEye';

/** Persistent HUD on map screens: who you are, how far NOESIS is restored. */
export function TopBar({
  title,
  onBack,
  backLabel,
  onCodex,
  onSettings,
  reduced,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  onCodex: () => void;
  onSettings: () => void;
  reduced: boolean;
}) {
  const game = useGame();
  const xp = useTween(game.xp, 1.2);
  const rank = rankOf(game.xp);
  const into = (xp % RANK_XP) / RANK_XP;
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onBack ? (
          <button className="hud-back" onClick={onBack}>
            ◂ <span>{backLabel}</span>
          </button>
        ) : (
          <span className="brand">NÓESIS</span>
        )}
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-rank">
        <NoesisEye size={40} modules={game.modules.length} reduced={reduced} />
        <div>
          <span className="rank-name">
            {String(rank + 1).padStart(2, '0')} · {RANKS[rank]}
          </span>
          <div className="xp-bar">
            <i style={{ width: `${into * 100}%` }} />
          </div>
          <small>
            {Math.round(xp)} XP · {game.modules.length}/14 módulos
          </small>
        </div>
      </div>
      <div className="topbar-right">
        <button className="btn ghost small" onClick={onCodex}>
          Códex <kbd>C</kbd>
        </button>
        <button className="btn ghost small" onClick={onSettings}>
          Ajustes
        </button>
      </div>
    </header>
  );
}
