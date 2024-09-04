'use client';
import { Button, HStack } from '@chakra-ui/react';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { useWs } from '@/app/contexts/SocketContext';
import { SessionStatus } from '@/utils/enums';

export function Controls() {
    const ws = useWs();
    const { user } = useSelector(state => state.misc);
    const { status, seats, players, current_player, owner } = useSelector(state => state.game);

    const toSupport = current_player
        ? (Math.max(...players.map((p: IPlayer) => p.currentbet)) - players[current_player]?.currentbet || 5)
        : 0;

    const buttons = [
        [],
        [
            { label: 'Start', color: 'yellow', payload: { type: 'start' } }
        ],
        [
            { label: `Бет (${toSupport})`, color: 'teal', payload: { type: 'bet', value: toSupport } },
            { label: 'Колл', color: 'teal', payload: { type: 'call' } },
            { label: `Рейз (${toSupport})`, color: 'teal', payload: { type: 'raise', value: toSupport } },
            { label: 'Пасс', color: 'red', payload: { type: 'pass' } },
            { label: 'Чек', color: 'red', payload: { type: 'check' } }
        ]
    ];

    return <HStack h='70px' spacing='8px'>
        {(
                status === SessionStatus.LOBBY
                    ? (seats.filter(s => s).length >= 2 && owner === user?.uuid)
                    : (seats[current_player ?? 0] === user?.uuid)
            ) &&
            buttons[status].map((b: any, i: number) => <Button key={i} h='100%' p='12px 24px' fontSize='18px' rounded='10px' variant='outline' colorScheme={b.color} onClick={() => ws.current.send(JSON.stringify(b.payload))}>{b.label}</Button>)}
    </HStack>;
}
