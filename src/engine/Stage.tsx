import {
  createContext,
  forwardRef,
  useContext,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { C } from './palette';

// The Stage is a fixed 1600×900 coordinate space (16:9) scaled to fit its container.
// SVG holds geometry; an HTML overlay with the same proportions holds KaTeX labels.
// Overlay sizes use --su (one stage unit in container-query width) so text scales with art.
export const W = 1600;
export const H = 900;

const OverlayCtx = createContext<HTMLDivElement | null>(null);
/** Accumulated opacity of enclosing <Group>s, so HTML labels fade with their SVG group. */
const OpacityCtx = createContext(1);

/**
 * SVG group whose opacity also applies to <Html> labels inside it.
 * Always use Group (not <g opacity>) around content that contains Html labels.
 */
export function Group({
  opacity = 1,
  children,
  transform,
}: {
  opacity?: number;
  children?: ReactNode;
  transform?: string;
}) {
  const parent = useContext(OpacityCtx);
  if (opacity <= 0.001) return null;
  return (
    <OpacityCtx.Provider value={parent * opacity}>
      <g opacity={opacity} transform={transform}>
        {children}
      </g>
    </OpacityCtx.Provider>
  );
}

export const Stage = forwardRef<
  SVGSVGElement,
  {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    onPointerDown?: React.PointerEventHandler<SVGSVGElement>;
    grid?: boolean;
    vignette?: boolean;
  }
>(function Stage({ children, className, style, onPointerDown, grid = true, vignette = false }, ref) {
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  return (
    <div className={`stage-fit ${className ?? ''}`} style={style}>
      <div className="stage">
        <svg
          ref={ref}
          className="stage-svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          onPointerDown={onPointerDown}
        >
          <StageDefs />
          {grid && <BackdropGrid />}
          <OverlayCtx.Provider value={overlay}>{children}</OverlayCtx.Provider>
          {vignette && <rect width={W} height={H} fill="url(#vignette)" pointerEvents="none" />}
        </svg>
        <div className="stage-overlay" ref={setOverlay} />
      </div>
    </div>
  );
});

function StageDefs() {
  return (
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="glow-strong" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="9" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
        <stop offset="60%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
      <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1.2" fill={C.line} />
      </pattern>
      <marker
        id="arrowhead"
        viewBox="0 0 10 10"
        refX="8"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto-start-reverse"
      >
        <path d="M0 0L10 5L0 10z" fill="context-stroke" />
      </marker>
    </defs>
  );
}

function BackdropGrid() {
  return <rect className="stage-dots" width={W} height={H} fill="url(#dots)" opacity={0.55} pointerEvents="none" />;
}

/**
 * HTML label positioned in stage units, rendered into the overlay (keeps KaTeX crisp).
 * anchor: where (x,y) sits on the label box.
 */
export function Html({
  x,
  y,
  children,
  anchor = 'center',
  opacity = 1,
  size = 30,
  color,
  className,
  style,
  interactive = false,
}: {
  x: number;
  y: number;
  children: ReactNode;
  anchor?: 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'bottom-left';
  opacity?: number;
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
  interactive?: boolean;
}) {
  const overlay = useContext(OverlayCtx);
  const inherited = useContext(OpacityCtx);
  const op = opacity * inherited;
  if (!overlay || op <= 0.001) return null;
  const tx = {
    center: '-50%,-50%',
    left: '0,-50%',
    right: '-100%,-50%',
    top: '-50%,0',
    bottom: '-50%,-100%',
    'top-left': '0,0',
    'bottom-left': '0,-100%',
  }[anchor];
  return createPortal(
    <div
      className={`stage-html ${className ?? ''}`}
      style={{
        left: `${(x / W) * 100}%`,
        top: `${(y / H) * 100}%`,
        transform: `translate(${tx})`,
        opacity: op,
        // labels scale with the stage but never drop below a legible floor (see --label-min)
        fontSize: `max(calc(var(--su) * ${size}), var(--label-min, 0px))`,
        color,
        pointerEvents: interactive ? 'auto' : 'none',
        ...style,
      }}
    >
      {children}
    </div>,
    overlay,
  );
}

/** Linear map from a math rectangle to a pixel rectangle (y axis points up). */
export interface Plane {
  x: (v: number) => number;
  y: (v: number) => number;
  pt: (x: number, y: number) => [number, number];
  inv: (px: number, py: number) => [number, number];
  xr: [number, number];
  yr: [number, number];
  box: { x: number; y: number; w: number; h: number };
  sx: number;
  sy: number;
}
export function plane(
  xr: [number, number],
  yr: [number, number],
  box = { x: 160, y: 90, w: 1280, h: 720 },
): Plane {
  const sx = box.w / (xr[1] - xr[0]);
  const sy = box.h / (yr[1] - yr[0]);
  const x = (v: number) => box.x + (v - xr[0]) * sx;
  const y = (v: number) => box.y + box.h - (v - yr[0]) * sy;
  return {
    x,
    y,
    pt: (a, b) => [x(a), y(b)],
    inv: (px, py) => [xr[0] + (px - box.x) / sx, yr[0] + (box.y + box.h - py) / sy],
    xr,
    yr,
    box,
    sx,
    sy,
  };
}
