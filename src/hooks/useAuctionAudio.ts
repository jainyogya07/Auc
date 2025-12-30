import { useEffect, useRef } from 'react';
import { useAuctionStore } from '../store/useAuctionStore';

// Placeholder Sounds - Replace with local assets in production
const SOUNDS = {
    SOLD: 'https://cdn.freesound.org/previews/32/32304_37876-lq.mp3', // Simple Gavel/Hammer
    UNSOLD: 'https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3', // Thud/Stamp
    NEW_PLAYER: 'https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3' // Swoosh/Transition
};

export function useAuctionAudio() {
    const { status, currentPlayer } = useAuctionStore();
    const prevStatus = useRef(status);
    const prevPlayerId = useRef(currentPlayer?.id);

    const playSound = (url: string) => {
        const audio = new Audio(url);
        audio.play().catch(err => console.warn('Audio play failed:', err));
    };

    useEffect(() => {
        // Status driven sounds
        if (prevStatus.current !== status) {
            if (status === 'SOLD') {
                playSound(SOUNDS.SOLD);
            } else if (status === 'UNSOLD') {
                playSound(SOUNDS.UNSOLD);
            }
            prevStatus.current = status;
        }

        // Player change sound (When going from IDLE/SOLD -> NOMINATED)
        if (currentPlayer?.id !== prevPlayerId.current) {
            if (currentPlayer && status === 'NOMINATED') {
                playSound(SOUNDS.NEW_PLAYER);
            }
            prevPlayerId.current = currentPlayer?.id;
        }
    }, [status, currentPlayer]);
}
