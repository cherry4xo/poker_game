'use client';
import getLayout from '@/layouts';
import { useSelector } from '@/redux/hooks';

export default function Home() {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);

    return <Layout />;
}