import { useEffect } from 'react';

export const usePullToRefresh = (onRefresh: () => void) => {
    useEffect(() => {
        let startY = 0;
        let currentY = 0;
        let pulling = false;

        const handleTouchStart = (e: TouchEvent) => {
            // Only trigger if at top of page
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                pulling = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!pulling) return;

            currentY = e.touches[0].clientY;
            const pullDistance = currentY - startY;

            // If pulled down more than 80px
            if (pullDistance > 80) {
                e.preventDefault();
            }
        };

        const handleTouchEnd = () => {
            if (!pulling) return;

            const pullDistance = currentY - startY;

            // Trigger refresh if pulled > 80px
            if (pullDistance > 80) {
                onRefresh();
            }

            pulling = false;
            startY = 0;
            currentY = 0;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [onRefresh]);
};

/**
 * Haptic feedback for mobile devices
 */
export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'medium') => {
    if ('vibrate' in navigator) {
        const patterns = {
            light: 10,
            medium: 20,
            heavy: 50
        };
        navigator.vibrate(patterns[style]);
    }
};

/**
 * Check if running as PWA
 */
export const isPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
};

/**
 * Prevent zoom on double-tap (mobile)
 */
export const preventDoubleTapZoom = (element: HTMLElement) => {
    let lastTouchEnd = 0;

    element.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
};
