'use client';
import { Button, HStack, Slider, SliderFilledTrack, SliderThumb, SliderTrack, Text, VStack } from '@chakra-ui/react';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { useWs } from '@/contexts/SocketContext';
import { SessionStatus } from '@/utils/enums';
import { useState } from 'react';
import { colors } from '@/utils/misc';

function MySlider({ data }: any) {
    const ws = useWs();
    const { status, seats, current_player } = useSelector(state => state.game);
    const { user } = useSelector(state => state.misc);
    const [value, setValue] = useState(Math.round((data.slider[0] + data.slider[1]) / 2));

    return <VStack>
        <Slider aria-label='slider' w='100px' min={data.slider[0]} max={data.slider[1]} step={200} value={value} onChange={val => setValue(val)}>
            <SliderTrack h='10px' rounded='200px' bg='purple.600'>
                <SliderFilledTrack bg='purple.600' />
            </SliderTrack>
            <SliderThumb bg='green.500' />
        </Slider>

        <Button
            h='100%' p='6px 18px' fontSize='15px' rounded='200px' variant='outline' colorScheme={data.color}
            isDisabled={status === SessionStatus.GAME ? (seats[current_player ?? 0] !== user?.uuid) : false}
            onClick={() => ws.current.send(JSON.stringify({ ...data.payload, value }))}
        >
            {data.label} <Text as='span' color='whiteAlpha.800' pl='4px'>({value})</Text>
        </Button>
    </VStack>;
}

export function Controls() {
    const ws = useWs();
    const { user } = useSelector(state => state.misc);
    const { allowed_actions, status, seats, players, current_player, owner, big_blind } = useSelector(state => state.game);

    const buttons = [
        [],
        [
            { label: 'Начать игру', color: 'yellow', payload: { type: 'start' } }
        ],
        [
            { label: 'Bet', color: 'teal', payload: { type: 'bet' }, slider: [big_blind, players.find((p: IPlayer) => p.id === user?.uuid)?.balance ?? big_blind] },
            { label: 'Call', color: 'teal', payload: { type: 'call' } },
            { label: 'Raise', color: 'teal', payload: { type: 'raise' }, slider: [big_blind, players.find((p: IPlayer) => p.id === user?.uuid)?.balance ?? big_blind] },
            { label: 'All-in', color: 'yellow', payload: { type: 'raise', value: players.find((p: IPlayer) => p.id === user?.uuid)?.balance ?? big_blind } },
            { label: 'Fold', color: 'red', payload: { type: 'pass' } },
            { label: 'Check', color: 'red', payload: { type: 'check' } }
        ],
        [],
        []
    ];

    return <HStack h='40px' spacing='8px' align='end'>
        {(status === SessionStatus.LOBBY ? (seats.filter(s => s).length >= 2 && owner === user?.uuid) : true) &&
            buttons[status]
                .filter(b => status === SessionStatus.GAME ? allowed_actions.includes(b.payload.type) : true)
                .map((b, i: number) => <VStack key={i}>
                    {!!b.slider
                        ? <MySlider data={b} />
                        : <Button
                            h='100%' p='6px 18px' fontSize='15px' rounded='200px' variant='outline' colorScheme={b.color}
                            isDisabled={status === SessionStatus.GAME ? (seats[current_player ?? 0] !== user?.uuid) : false}
                            onClick={() => ws.current.send(JSON.stringify(b.payload))}
                        >
                            {b.label}
                        </Button>}
                </VStack>)}
    </HStack>;
}
