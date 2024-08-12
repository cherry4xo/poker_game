'use client';
import { useApi } from '@/hooks';
import { useEffect } from 'react';

export default function Join({ params: { game_id } }: { params: { game_id: string } }) {
    const { join } = useApi();

    useEffect(() => {
        join(game_id);
    }, []);

    return <></>;
}