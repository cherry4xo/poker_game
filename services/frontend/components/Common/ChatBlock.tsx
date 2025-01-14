'use client';
import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, IconButton, Input, Text, useDisclosure, VStack } from '@chakra-ui/react';
import { useCallback, useRef, useState } from 'react';
import { useWs } from '@/contexts/SocketContext';
import { useSelector } from '@/redux/hooks';
import { IMessage, IPlayer } from '@/utils/types';
import { IoSend } from 'react-icons/io5';
import { animate } from 'framer-motion';
import { colors, ease } from '@/utils/misc';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { IoChatbubbleSharp } from "react-icons/io5";

export function Interface() {
    const ws = useWs();
    const [text, setText] = useState('');
    const { chat, typing, device } = useSelector(state => state.misc);
    const { seats, players } = useSelector(state => state.game);
    const time = useRef(null as unknown as NodeJS.Timeout);

    const send = useCallback(() => {
        if (text.length <= 0) return;
        endTyping();
        ws.current.send(JSON.stringify({ type: 'new_message', message: text }));
        setText('');
    }, [text, ws]);

    const endTyping = useCallback(() => {
        clearTimeout(time.current);
        time.current = null as unknown as NodeJS.Timeout;
        ws.current.send(JSON.stringify({ type: 'typing_end' }));
    }, [time]);

    return <VStack w='100%' h='100%' justify='end'>
        <VStack w={device !== 'phone' ? '400px' : '100%'} maxH={device !== 'phone' ? '120px' : '100%'} fontSize='14px' overflowY='auto' id='chatList'>
            {chat.length > 0
                ? chat.map((msg: IMessage, i: number) => <HStack key={i} w='100%' justify='start' spacing='10px'>
                    <Text opacity={.3}>{msg.datetime}</Text>
                    <Text color={colors[seats.indexOf(msg.player_id)]}>{msg.username}</Text>
                    <Text>{msg.text}</Text>
                </HStack>)
                : <Text w='100%' textAlign='left' opacity={.5}>пустовато тут... напишите первым!</Text>}
        </VStack>

        <HStack w='100%' h='20px' justify='start' fontSize='13px' opacity={.75}>
            {typing
                .filter((t: string) => players.findIndex((p: IPlayer) => p.id === t) > -1)
                .slice(0, 3)
                .map((t: string, i: number) => {
                    const player = players.find((p: IPlayer) => p.id === t) as IPlayer;
                    return <Text key={i} as='span' color={colors[seats.indexOf(t)]}>{player.name}</Text>;
                })}

            {typing.length > 0 && <Text>typing...</Text>}
        </HStack>

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

                        if (!time.current) ws.current.send(JSON.stringify({ type: 'typing_start' }));
                        clearTimeout(time.current);
                        time.current = setTimeout(endTyping, 2000);
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
    </VStack>;
}

export function ChatBlock() {
    const { device } = useSelector(state => state.misc);
    const [opened, setOpened] = useState(true);
    const { isOpen, onOpen, onClose } = useDisclosure();

    return device !== 'phone'
        ? <VStack w='100%' p='16px 20px' spacing='14px' id='pablo' pos='relative' bg='gray.800'>
            <Interface />

            <IconButton aria-label='open chat' icon={opened ? <FaAngleLeft /> : <FaAngleRight />} colorScheme='blackAlpha' rounded='0 25px 0 0' border='1px solid rgba(0,0,0,.75)' h='100%' pos='absolute' bottom='0%' right='-40px' onClick={() => {
                animate('#pablo', { x: opened ? -440 : 0 }, { duration: 0.5, ease });
                setOpened(s => !s);
            }} />
        </VStack>
        : <>
            <IconButton icon={<IoChatbubbleSharp />} isRound boxSize='50px' fontSize='20px' aria-label='open chat' pos='fixed' bottom='10px' left='10px' colorScheme='blackAlpha' onClick={onOpen} />

            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                placement='left'
            >
                <DrawerOverlay />
                <DrawerContent bg='black' color='white'>
                    <DrawerCloseButton />

                    <DrawerHeader>
                        <Text>Чат</Text>
                    </DrawerHeader>

                    <DrawerBody pb='20px'>
                        <Interface />
                    </DrawerBody>

                </DrawerContent>
            </Drawer>
        </>;
}
