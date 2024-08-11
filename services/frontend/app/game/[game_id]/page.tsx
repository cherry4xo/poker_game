'use client';
import { useContext, useEffect } from 'react';
import getLayout from '@/layouts/game';
import { useDispatch, useSelector } from '@/redux/hooks';
import { SocketContext } from '@/app/SocketContext';
import { setGameState } from '@/redux/gameSlice';
import { useApi } from '@/hooks';

export default function Game({ params: { game_id } }: { params: { game_id: string } }) {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);
    const dispatch = useDispatch();
    const { user } = useApi();
    const ws = useContext(SocketContext);

    useEffect(() => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        const socket = new WebSocket(`wss://api.cherry4xo.ru/poker_game/game/${game_id}/${user.username}`);

        socket.onopen = () => console.log('ws opened');
        socket.onclose = () => console.log('ws closed');

        socket.onmessage = e => {
            const data = JSON.parse(JSON.parse(e.data));
            dispatch(setGameState(data));
        };

        ws.current = socket;
    }, []);

    return <Layout />;
}
