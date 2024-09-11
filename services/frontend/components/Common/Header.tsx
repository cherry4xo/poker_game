'use client';
import { Button, HStack, Icon, IconButton, Text, Tooltip, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useWs } from '@/contexts/SocketContext';
import { useDispatch, useSelector } from '@/redux/hooks';
import { TbDoorExit, TbHome } from 'react-icons/tb';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { Sum } from '@/components/Common/Sum';

export function Header() {
    const ws = useWs();
    const { user } = useSelector(state => state.misc);
    const toast = useToast();
    const dispatch = useDispatch();
    const pathname = usePathname();

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

    const home = { label: 'На главную', icon: TbHome, href: '/', props: { colorScheme: 'purple' } };
    const leave = { label: 'Покинуть игру', icon: TbDoorExit, href: '/', props: { colorScheme: 'red' }, onClick: exit };

    const links = {
        '/game': [home, leave],
        '/me': [home]
    }[pathname] ?? [];

    const displayLabels = pathname !== '/game';

    return <HStack w='100%' justify='space-between'>
        <HStack spacing='12px'>
            {links.length > 0
                ? links.map((btn: any, i: number) => <Tooltip key={i} label={btn.label} isDisabled={displayLabels}>
                    <Link href={btn.href}>
                        {displayLabels
                            ? <Button {...btn.props} leftIcon={<btn.icon />} onClick={btn?.onClick ?? (() => {
                            })}>{btn.label}</Button>
                            : <IconButton {...btn.props} aria-label={btn.label} icon={<btn.icon />} onClick={btn?.onClick ?? (() => {
                            })} />}
                    </Link>
                </Tooltip>)
                : <div />}
        </HStack>

        <Link href='/me'>
            {user && <HStack spacing='10px' mr='10px' _hover={{ opacity: .75 }} transition='0.2s'>
                <Icon as={FaUserCircle} w='20px' h='20px' />
                <Text fontWeight={600} opacity={.75}>{user.username}</Text>
                {/*<Sum>{user.balance}</Sum>*/}
            </HStack>}
        </Link>
    </HStack>;
}