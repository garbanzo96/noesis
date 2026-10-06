import { useTween } from '../../engine/hooks';
import { RANKS, RANK_XP, rankOf, useGame } from '../state';

/** Persistent HUD on map screens. */
export function TopBar({
  title,
  onBack,
  backLabel,
  onCodex,
  onSettings,
}: {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  onCodex: () => void;
  onSettings: () => void;
  reduced?: boolean;
}) {
  const game = useGame();
  const xp = useTween(game.xp, 1.2);
  const rank = rankOf(game.xp);
  const into = (xp % RANK_XP) / RANK_XP;
  const closed = Object.values(game.levels).filter((l) => l.done).length;
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
        <div className="badge">N</div>
        <div>
          <span className="rank-name">{RANKS[rank]}</span>
          <div className="xp-bar">
            <i style={{ width: `${into * 100}%` }} />
          </div>
          <small>
            {Math.round(xp)} XP · {closed} casos cerrados
          </small>
        </div>
      </div>
      <div className="topbar-right">
        <button className="btn ghost small" onClick={onCodex}>
          Cuaderno <kbd>C</kbd>
        </button>
        <button className="btn ghost small" onClick={onSettings}>
          Ajustes
        </button>
      </div>
    </header>
  );
}
