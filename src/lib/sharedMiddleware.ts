import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type BroadcastChannelOptions = {
    name: string;
};

// Simple generic middleware that doesn't try to be too clever with types
// allowing 'any' for the middleware specific parts to avoid TS complexities 
// in this quick prototype.
export const shared = <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
    params: BroadcastChannelOptions,
    f: StateCreator<T, Mps, Mcs>
): StateCreator<T, Mps, Mcs> => {
    const channel = new BroadcastChannel(params.name);

    return (set, get, api) => {

        channel.onmessage = (event) => {
            if (event.data && event.data.type === 'SYNC_STATE') {
                console.log('Received SYNC_STATE:', event.data.payload);
                // Ensure we don't trigger another broadcast
                // We use api.setState which usually bypasses our wrapped 'set' 
                // but we need to verify if the implementation of zustand calls 'set' internally differently.
                // In standard zustand, api.setState calls the setter. 
                // We need to bypass our broadcast wrapper.

                // Hack: We can't easily bypass the wrapper if we wrap 'set'.
                // So we will just update the internal state directly via the original setState
                // if possible, OR we define a flag.

                // Actually, the simplest way is to compare state? No, that's heavy.
                // Let's rely on the fact that we are replacing the WHOLE state.

                // Using 'true' as second arg to replace state if supported, or just merge.
                // @ts-ignore
                api.setState(event.data.payload);
            }
        };

        const newSet: any = (partial: any, replace: any) => {
            // Apply the update
            set(partial, replace);

            // Broadcast the new state
            // We strip out functions because they cannot be cloned
            const rawState = get() as Record<string, any>;
            const cleanState = Object.fromEntries(
                Object.entries(rawState).filter(([_, value]) => typeof value !== 'function')
            );

            console.log('Broadcasting state update:', cleanState);
            channel.postMessage({ type: 'SYNC_STATE', payload: cleanState });
        };

        return f(newSet, get, api);
    };
};
