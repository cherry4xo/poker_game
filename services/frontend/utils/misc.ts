import { Easing } from 'framer-motion';

export const ease = [0.410, 0.030, 0.000, 0.995] as unknown as Easing[];

export const randomorg = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const positions: any[] = [
    { left: '-20%', top: '-20%' },
    { left: '100%', top: '-20%' },
    { left: '100%', top: '100%' },
    { left: '-20%', top: '100%' },
];

export const colors = ['#F7AEF8', '#B388EB', '#8093F1', '#72DDF7'];
