import { createContext, useRef } from 'react';

export const SocketContext = createContext(null as any);

export function SocketContextProvider({ children }: { children: React.ReactNode }) {
    const ws = useRef(null as unknown as WebSocket);

    return <SocketContext.Provider value={ws}>
        {children}
    </SocketContext.Provider>;
}
