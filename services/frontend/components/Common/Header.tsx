'use client';
import { Button, HStack, IconButton, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useWs } from '@/app/SocketContext';
import { useDispatch, useSelector } from '@/redux/hooks';
import { TbCirclePlus, TbDoorExit, TbHome } from 'react-icons/tb';
import { SessionStatus } from '@/utils/enums';

export function Header() {
    const { id, status } = useSelector(state => state.game);
    const ws = useWs();
    const toast = useToast();
    const dispatch = useDispatch();

    return <HStack w='100%'>
        <Link href='/'><IconButton aria-label='go home' icon={<TbHome />} /></Link>

        <Link href='/'>
            <Button leftIcon={<TbDoorExit />} onClick={() => {
                ws.current.send(JSON.stringify({ type: 'exit' }));
                toast({
                    status: 'info',
                    title: 'Вы покинули игру!',
                    duration: 3000,
                    isClosable: true
                });
                dispatch({ type: 'misc/clearUserSession' });
            }}>Покинуть игру</Button>
        </Link>

        <Button leftIcon={<TbCirclePlus />} isDisabled={status === SessionStatus.GAME} onClick={() => {
            prompt('Скопируйте и отправьте другу!', 'https://poker.twodev.cc/join/' + id);

            toast({
                status: 'info',
                description: 'Ссылка скопирована в буфер обмена! Отправьте её другу!',
                duration: 3000,
                isClosable: true
            });
        }}>Пригласить друга</Button>
    </HStack>;
}