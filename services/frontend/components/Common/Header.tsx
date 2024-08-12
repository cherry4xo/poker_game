'use client';
import { Button, HStack, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useContext } from 'react';
import { SocketContext } from '@/app/SocketContext';
import { useDispatch } from '@/redux/hooks';

export function Header() {
    const ws = useContext(SocketContext);
    const toast = useToast();
    const dispatch = useDispatch();

    return <HStack w='100%'>
        <Link href='/'><Button>На главную</Button></Link>
        <Link href='/'><Button onClick={() => {
            ws.current.send(JSON.stringify({ type: 'exit' }));
            toast({
                status: 'info',
                title: 'Вы покинули игру!',
                duration: 3000,
                isClosable: true
            });
            dispatch({ type: 'misc/clearUserSession' });
        }}>Выйти из игры</Button></Link>
    </HStack>
}