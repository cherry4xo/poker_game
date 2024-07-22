'use client';

import { useEffect } from 'react';

export default function Game({ params: { game_id } }: { params: { game_id: string } }) {
    useEffect(() => {
        console.log(game_id);
    }, []);

    return <></>;
}