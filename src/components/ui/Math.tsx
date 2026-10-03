import katex from 'katex';
import { useMemo } from 'react';
export function Math({ tex, block = false }: { tex: string; block?: boolean }) {
  const html = useMemo(
    () =>
      katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: 'ignore',
        trust: false,
        output: 'htmlAndMathml',
      }),
    [tex, block],
  );
  return (
    <span
      className={block ? 'math math-block' : 'math'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
