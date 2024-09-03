'use client';
import { HStack, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useWs } from '@/app/SocketContext';
import { useDispatch } from '@/redux/hooks';
import { TbDoorExit, TbHome } from 'react-icons/tb';

export function Header() {
    const ws = useWs();
    const toast = useToast();
    const dispatch = useDispatch();

    return <HStack w='100%'>
        <Tooltip label='На главную'>
            <Link href='/'><IconButton aria-label='go home' icon={<TbHome />} /></Link>
        </Tooltip>

        <Tooltip label='Покинуть игру'>
            <Link href='/'>
                <IconButton colorScheme='red' aria-label='end game' icon={<TbDoorExit />} onClick={() => {
                    ws.current.send(JSON.stringify({ type: 'exit' }));
                    dispatch({ type: 'misc/clearUserSession' });

                    toast({
                        status: 'info',
                        title: 'Вы покинули игру!',
                        duration: 3000,
                        isClosable: true
                    });
                }} />
            </Link>
        </Tooltip>
    </HStack>;
}