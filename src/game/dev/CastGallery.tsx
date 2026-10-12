import { CAST, Portrait, type CastId } from '../../art/cast';

/** Dev-only sheet of every portrait (#/dev/cast), for visual QA. */
export function CastGallery() {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: 16, background: '#070613', minHeight: '100vh' }}>
      {(Object.keys(CAST) as CastId[]).map((id) => (
        <figure key={id} style={{ margin: 0, textAlign: 'center', color: CAST[id].color, fontFamily: 'monospace' }}>
          <Portrait id={id} size={220} talking={id === 'iris'} />
          <figcaption>{CAST[id].name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
