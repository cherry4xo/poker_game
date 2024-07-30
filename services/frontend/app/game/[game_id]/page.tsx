'use client';
import { useEffect } from 'react';
import getLayout from '@/layouts/game';
import { useSelector } from '@/redux/hooks';
import { useWs } from '@/hooks';

export default function Game({ params: { game_id } }: { params: { game_id: string } }) {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);

    const { connect } = useWs();

    useEffect(() => {
        connect(game_id, 'pablo1');
    }, []);

    return <Layout />;
}
