'use client';
import getLayout from '@/layouts/auth';
import { useSelector } from '@/redux/hooks';

export default function Auth() {
    const { device } = useSelector(({ misc }) => misc);
    const Layout = getLayout(device);

    return <Layout />;
}