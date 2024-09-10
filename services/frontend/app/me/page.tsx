'use client';
import getLayout from '@/layouts/me';
import { useSelector } from '@/redux/hooks';

export default function Game() {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);

    return <Layout />;
}
