'use client';
import { useDispatch, useSelector } from '@/redux/hooks';
import { setDevice } from "@/redux/miscSlice";
import { motion } from 'framer-motion';
import { ease } from "@/utils/misc";
import { useEffect } from "react";

export function Launcher() {
    const dispatch = useDispatch();
    const { device } = useSelector(({ misc }) => misc);

    useEffect(() => {
        function launch() {
            dispatch(setDevice(
                window.matchMedia("(min-width: 600px)").matches && window.matchMedia("(max-width: 900px)").matches
                    ? 'tablet'
                    : window.matchMedia("(max-width: 600px)").matches
                        ? 'phone'
                        : 'laptop'
            ));
        }

        launch();
        window.onresize = launch;
    }, [dispatch]);

    return <>
        <motion.div
            style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 10000, background: 'black', pointerEvents: 'none' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: device === null ? 1 : 0 }}
            transition={{ duration: 0.3, ease }}
        />
    </>
}