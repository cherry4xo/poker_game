'use client';
import { Button, HStack } from '@chakra-ui/react';
import { useDispatch, useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';

export function Controls() {
    const dispatch = useDispatch();
    const { status, players, current_player } = useSelector(state => state.game);

    const toSupport = current_player ? (Math.max(...players.map((p: IPlayer) => p.currentbet)) - players[current_player]?.currentbet || 5) : 0;

    const buttons = [
        [],
        [
            { label: 'Start', color: 'yellow', action: { type: 'game/startGame' } }
        ],
        [
            { label: 'Bet ' + toSupport, color: 'teal', action: { type: 'game/bet', payload: toSupport } },
            // { label: 'Check', color: 'teal' },
            { label: 'Pass', color: 'red', action: { type: 'game/pass' } }
        ]
    ];

    return <HStack h='80px' spacing='12px'>
        {buttons[status].map((b: any, i: number) =>
            <Button key={i} h='100%' px='40px' rounded='10px' variant='outline' colorScheme={b.color} onClick={() => dispatch(b.action)}>{b.label}</Button>)}
    </HStack>
}
