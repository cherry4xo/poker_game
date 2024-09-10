import { motion } from 'framer-motion';
import { ease } from '@/utils/misc';
// @ts-ignore
import * as deck from '@letele/playing-cards';

export function Card({ data, i }: { data: { rank: string, suit: string } | undefined, i: number }) {
    let TheCard = deck.B1;

    if (!!data) {
        const rank = !isNaN(parseInt(data.rank)) ? data.rank : data.rank[0].toUpperCase();
        const suit = data.suit[0].toUpperCase();
        TheCard = deck[`${suit}${rank}`] ?? deck.B2;
    }

    const fill = { width: '100%', height: '100%' };

    return <motion.div
        key={TheCard}
        style={fill}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 * i, duration: .5, ease }}
    >
        <TheCard style={fill} />
    </motion.div>;
}
