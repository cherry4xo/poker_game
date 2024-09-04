'use client';
import { Button, HStack, IconButton, Tooltip, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useWs } from '@/app/contexts/SocketContext';
import { useDispatch } from '@/redux/hooks';
import { TbDoorExit, TbHome } from 'react-icons/tb';
import { useCallback } from 'react';

export function Header({ displayLabels }: { displayLabels?: boolean }) {
    const ws = useWs();
    const toast = useToast();
    const dispatch = useDispatch();

    const exit = useCallback(() => {
        ws.current.send(JSON.stringify({ type: 'exit' }));
        dispatch({ type: 'misc/clearUserSession' });

        toast({
            status: 'info',
            title: 'Вы покинули игру!',
            duration: 3000,
            isClosable: true
        });
    }, [ws, dispatch, toast]);

    return <HStack>
        {[
            { label: 'На главную', icon: TbHome, href: '/', props: { colorScheme: 'purple' } },
            { label: 'Покинуть игру', icon: TbDoorExit, href: '/', props: { colorScheme: 'red' }, onClick: exit }
        ].map((btn: any, i: number) => <Tooltip key={i} label={btn.label} isDisabled={displayLabels}>
            <Link href={btn.href}>
                {displayLabels
                    ? <Button {...btn.props} leftIcon={<btn.icon />} onClick={btn?.onClick ?? (() => {})}>{btn.label}</Button>
                    : <IconButton {...btn.props} aria-label={btn.label} icon={<btn.icon />} onClick={btn?.onClick ?? (() => {})} />}
            </Link>
        </Tooltip>)}
    </HStack>;
}