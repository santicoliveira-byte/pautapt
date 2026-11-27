import { useEffect } from 'react';

let activeLocksCount = 0;
let savedScrollY = 0;

/**
 * Locks document/body scrolling while a modal or bottom-sheet is open.
 * Uses `position: fixed` with preserved scroll offset so iOS Safari and
 * Android Chrome cannot scroll the underlying page behind the modal.
 */
export function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;

    if (activeLocksCount === 0) {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      const html = document.documentElement;
      const body = document.body;

      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${savedScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
    }

    activeLocksCount += 1;

    return () => {
      activeLocksCount = Math.max(0, activeLocksCount - 1);
      if (activeLocksCount === 0) {
        const html = document.documentElement;
        const body = document.body;

        html.style.overflow = '';
        body.style.overflow = '';
        body.style.position = '';
        body.style.top = '';
        body.style.left = '';
        body.style.right = '';
        body.style.width = '';

        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isLocked]);
}
