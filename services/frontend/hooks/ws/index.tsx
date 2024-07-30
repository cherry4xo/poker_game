// import { useRef } from 'react';
// import { useDispatch } from '@/redux/hooks';
// import { setGameState } from '@/redux/gameSlice';

// export function useWs() {
//     const dispatch = useDispatch();
//     const ws = useRef<WebSocket | null>(null);
//
//     return {
//         connect: (session_id: string, username: string) => {
//             if (ws.current) ws.current.close();
//             ws.current = new WebSocket(`wss://api.cherry4xo.ru/poker_game/game/${session_id}/${username}`);
//
//             ws.current.onopen = () => console.log('ws opened');
//             ws.current.onclose = () => console.log('ws closed');
//
//             ws.current.onmessage = e => {
//                 const data = JSON.parse(JSON.parse(e.data));
//                 dispatch(setGameState(data));
//             };
//         },
//         take_seat: (seat_num: number) => {
//             if (ws.current) ws.current.send(JSON.stringify({ type: 'take_seat', seat_num }));
//         }
//     };
// }

import { useState, useCallback, useEffect } from 'react';
import useWebSocket from 'react-use-websocket';
import { setGameState } from '@/redux/gameSlice';
import { useDispatch } from '@/redux/hooks';

export const useWs = () => {
    const dispatch = useDispatch();

    const [socketUrl, setSocketUrl] = useState(`wss://api.cherry4xo.ru/poker_game/game`);
    const { sendJsonMessage, lastMessage } = useWebSocket(socketUrl);

    useEffect(() => {
        if (lastMessage !== null) dispatch(setGameState(JSON.parse(JSON.parse(lastMessage.data))));
    }, [lastMessage]);

    const connect = useCallback(
        (session_id: string, username: string) => setSocketUrl(`wss://api.cherry4xo.ru/poker_game/game/${session_id}/${username}`),
        []
    );

    const take_seat = useCallback((seat_num: number) => {
        sendJsonMessage({ type: 'take_seat', seat_num });
    }, []);

    return {
        connect,
        take_seat
    };
};
