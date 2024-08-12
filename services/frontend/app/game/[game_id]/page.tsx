'use client';
import { useEffect } from 'react';
import getLayout from '@/layouts/game';
import { useSelector } from '@/redux/hooks';
import { useApi } from '@/hooks';

export default function Game({ params: { game_id } }: { params: { game_id: string } }) {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);
    const { join } = useApi();

    useEffect(() => {
        join(game_id);
    }, []);

    return <Layout />;
}
