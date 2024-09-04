'use client';
import { HStack, IconButton, Input, Text, VStack } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import { useWs } from '@/app/contexts/SocketContext';
import { useSelector } from '@/redux/hooks';
import { IMessage } from '@/utils/types';
import { IoSend } from 'react-icons/io5';
import { animate } from 'framer-motion';
import { colors, ease } from '@/utils/misc';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';

export function ChatBlock() {
    const ws = useWs();
    const [text, setText] = useState('');
    const { chat, device } = useSelector(state => state.misc);
    const { seats } = useSelector(state => state.game);
    const [opened, setOpened] = useState(true);
    const time = useRef(null as unknown as NodeJS.Timeout);

    const typing = useCallback(() => {
        if (!time.current) ws.current.send(JSON.stringify({ type: 'typing_start' }));
        time.current = setTimeout(() => ws.current.send(JSON.stringify({ type: 'typing_end' })), 1500);
    }, [time]);

    const send = useCallback(() => {
        if (text.length <= 0) return;
        ws.current.send(JSON.stringify({ type: 'typing_end' }));
        ws.current.send(JSON.stringify({ type: 'new_message', message: text }));
        setText('');
    }, [text, ws]);

    return <VStack w='100%' zIndex={10} p='16px 20px' spacing='14px' id='pablo' pos='relative' bg='gray.800'>
        <VStack w={device !== 'phone' ? '400px' : '300px'} maxH={device !== 'phone' ? '120px' : '11svh'} pb='10px' fontSize='14px' overflowY='auto' id='chatList'>
            {chat.length > 0
                ? chat.map((msg: IMessage, i: number) => <HStack key={i} w='100%' justify='start' spacing='10px'>
                    <Text opacity={.3}>{msg.datetime}</Text>
                    <Text color={colors[seats.indexOf(msg.player_id)]}>{msg.username}</Text>
                    <Text>{msg.text}</Text>
                </HStack>)
                : <Text w='100%' textAlign='left' opacity={.5}>пустовато тут... напишите первым!</Text>}
        </VStack>

        <HStack w='100%' opacity={.75} spacing={0}>
            <Input
                rounded='200px 0 0 200px'
                borderColor='gray.400'
                onKeyDown={(e: any) => {
                    if (e.code === 'Enter') send();
                }}
                value={text}
                onChange={(e: any) => {
                    if (e.target.value.length <= 100) {
                        setText(e.target.value);
                        typing();
                    }
                }}
            />

            <IconButton
                aria-label='send'
                icon={<IoSend />}
                rounded='0 200px 200px 0'
                isDisabled={text.length <= 0}
                onClick={send}
            />
        </HStack>

        <IconButton aria-label='open chat' icon={opened ? <FaAngleLeft /> : <FaAngleRight />} colorScheme='blackAlpha' rounded='0 25px 0 0' border='1px solid rgba(0,0,0,.75)' h='100%' pos='absolute' bottom='0%' right='-40px' onClick={() => {
            animate('#pablo', { x: opened ? (device !== 'phone' ? -440 : -340) : 0 }, { duration: 0.5, ease });
            setOpened(s => !s);
        }} />
    </VStack>;
}
