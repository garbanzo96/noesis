import { useEffect, useState } from 'react';
import { getLesson, worlds } from '../content';
import type { WorldId } from '../domain/types';
export type Route =
  | { page: 'map' | 'library' | 'arena' | 'settings' | 'progress' }
  | { page: 'world'; world: WorldId };
export function resolveRoute(hash: string): Route {
  const parts = hash.replace(/^#/, '').split('/');
  if (['map', 'library', 'arena', 'settings', 'progress'].includes(parts[0]))
    return { page: parts[0] as 'map' };
  if (parts[0] === 'world' && worlds.some((w) => w.id === parts[1]))
    return { page: 'world', world: parts[1] as WorldId };
  if (parts[0] === 'mission') {
    const lesson = getLesson(parts[1]);
    if (lesson) return { page: 'world', world: lesson.world };
  }
  return { page: 'map' };
}
export function useRoute() {
  const [route, setRoute] = useState(() => resolveRoute(window.location.hash));
  useEffect(() => {
    const change = () => {
      setRoute(resolveRoute(window.location.hash));
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  return route;
}
