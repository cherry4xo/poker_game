'use client';
import { Button, HStack } from '@chakra-ui/react';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { useWs } from '@/app/contexts/SocketContext';
import { SessionStatus } from '@/utils/enums';

export function Controls() {
    const ws = useWs();
    const { user } = useSelector(state => state.misc);
    const { allowed_actions, status, seats, players, current_player, owner } = useSelector(state => state.game);

    const toBet = 10;
    const toRaise = 20;

    const buttons = [
        [],
        [
            { label: 'Начать игру', color: 'yellow', payload: { type: 'start' } }
        ],
        [
            { label: `Бет (${toBet})`, color: 'teal', payload: { type: 'bet', value: toBet } },
            { label: 'Колл', color: 'teal', payload: { type: 'call' } },
            { label: `Рейз (${toRaise})`, color: 'teal', payload: { type: 'raise', value: Math.max(...players.map((p: IPlayer) => p.currentbet)) + toRaise } },
            { label: 'Фолд/пасс', color: 'red', payload: { type: 'pass' } },
            { label: 'Чек', color: 'red', payload: { type: 'check' } }
        ]
    ];

    return <HStack h='70px' spacing='8px'>
        {(status === SessionStatus.LOBBY ? (seats.filter(s => s).length >= 2 && owner === user?.uuid) : true) &&
            buttons[status]
                .filter(b => allowed_actions.includes(b.payload.type))
                .map((b, i: number) =>
                    <Button key={i} isDisabled={status === SessionStatus.GAME ? (seats[current_player ?? 0] !== user?.uuid) : false} h='100%' p='12px 24px' fontSize='18px' rounded='10px' variant='outline' colorScheme={b.color} onClick={() => ws.current.send(JSON.stringify(b.payload))}>{b.label}</Button>)}
    </HStack>;
}
