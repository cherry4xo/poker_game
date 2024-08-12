'use client';
import { useEffect } from 'react';

export default function JoinReturnHome() {
    useEffect(() => {
        window.location.replace('/');
    }, []);

    return <></>;
}