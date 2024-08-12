'use client';
import getLayout from '@/layouts/game';
import { useSelector } from '@/redux/hooks';
import { useEffect } from 'react';
import { useApi } from '@/hooks';

export default function Game() {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);

    const { connect } = useApi();

    useEffect(() => {
        connect();
    }, []);

    return <Layout />;
}
