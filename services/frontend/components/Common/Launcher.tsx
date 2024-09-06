'use client';
import { useDispatch, useSelector } from '@/redux/hooks';
import { setDevice, setHref } from '@/redux/miscSlice';
import { motion } from 'framer-motion';
import { ease } from '@/utils/misc';
import { useEffect } from 'react';
import { useApi } from '@/hooks';
import { usePathname } from 'next/navigation';

export function Launcher() {
    const dispatch = useDispatch();
    const { device } = useSelector(({ misc }) => misc);
    const { validate } = useApi();
    const pathname = usePathname();

    useEffect(() => {
        function launch() {
            dispatch(setDevice(
                window.matchMedia('(min-width: 600px)').matches && window.matchMedia('(max-width: 900px)').matches
                    ? 'tablet'
                    : window.matchMedia('(max-width: 600px)').matches
                        ? 'phone'
                        : 'laptop'
            ));
        }

        launch();
        window.onresize = launch;

        dispatch(setHref(window.location.origin));

        validate();
    }, [dispatch]);

    return <>
        <motion.div
            key={pathname}
            style={{ width: '100vw', height: '100svh', display: 'flex', flexDirection: 'column', padding: '30px', justifyContent: 'end', alignItems: 'end', position: 'fixed', top: 0, left: 0, zIndex: 10000, background: '#181c1f', pointerEvents: 'none' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: device === null ? 1 : 0 }}
            transition={{ duration: .5, ease }}
        >
            {/*<Spinner w='60px' h='60px' color='green.700' thickness='6px' speed='0.35s' />*/}
        </motion.div>
    </>;
}