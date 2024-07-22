'use client';
import { useEffect } from 'react';

export default function GameReturnHome() {
    useEffect(() => {
        window.location.replace('/');
    }, []);

    return <></>;
}