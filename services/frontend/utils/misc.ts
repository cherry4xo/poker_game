import { Easing } from 'framer-motion';

export const ease = [0.410, 0.030, 0.000, 0.995] as unknown as Easing[];

export const randomorg = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const positions: any = {
        players: [
            { left: '-20%', top: '-20%' }, // tl
            { left: '100%', top: '-20%' }, // tr
            { left: '-20%', top: '100%' }, // bl
            { left: '100%', top: '100%' } // br
        ],
        bets: [
            { left: '10%', top: '20%' },
            { left: '82%', top: '20%' },
            { left: '8%', top: '70%' },
            { left: '80%', top: '70%' }
        ],
        dots: [
            { left: '4%', top: '10%' },
            { left: '92%', top: '8%' },
            { left: '4%', top: '85%' },
            { left: '93%', top: '85%' }
        ]
    }
;

export const colors = ['#F7AEF8', '#B388EB', '#8093F1', '#72DDF7'];
