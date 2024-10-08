'use client';
import { Button, HStack, Icon, IconButton, Menu, MenuButton, MenuItem, MenuList, Text, Tooltip, useToast } from '@chakra-ui/react';
import Link from 'next/link';
import { useWs } from '@/contexts/SocketContext';
import { useDispatch, useSelector } from '@/redux/hooks';
import { TbDoorExit, TbHome } from 'react-icons/tb';
import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { FaUserCircle } from 'react-icons/fa';
import { useApi } from '@/hooks';
import { FaStar } from "react-icons/fa";
import { TfiCup } from "react-icons/tfi";

export function Header() {
    const { load } = useApi();
    const ws = useWs();
    const { user, loading } = useSelector(state => state.misc);
    const toast = useToast();
    const dispatch = useDispatch();
    const pathname = usePathname();

    const exit = useCallback(() => {
        ws.current.send(JSON.stringify({ type: 'exit' }));
        dispatch({ type: 'misc/clearUserSession' });

        toast({
            status: 'info',
            title: 'Вы покинули игру!'
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

        {user && <Menu>
            <MenuButton>
                <HStack spacing='10px' mr='10px' _hover={{ opacity: .75 }} transition='0.2s'>
                    <Icon as={FaUserCircle} w='20px' h='20px' />
                    <Text fontWeight={600} opacity={.75}>{user.username}</Text>
                    {/*<Sum>{user.balance}</Sum>*/}
                </HStack>
            </MenuButton>

            <MenuList bg='gray.700' color='white'>
                <Link href='/me'>
                    <MenuItem bg='gray.700'>
                        <HStack>
                            <Icon as={FaUserCircle} color='blue.400' />
                            <Text>Мой профиль</Text>
                        </HStack>
                    </MenuItem>
                </Link>
                <MenuItem bg='gray.700'>
                    <HStack>
                        <Icon as={FaStar} color='orange' />
                        <Text>Сыграно: <b>0</b></Text>
                    </HStack>
                </MenuItem>
                <MenuItem bg='gray.700'>
                    <HStack>
                        <Icon as={TfiCup} color='orange' />
                        <Text>Побед: <b>0</b></Text>
                    </HStack>
                </MenuItem>
                <MenuItem bg='gray.700'>
                    <Button onClick={() => load('signout')} isLoading={loading.signout} colorScheme='red' leftIcon={<TbDoorExit />}>Выйти из аккаунта</Button>
                </MenuItem>
            </MenuList>
        </Menu>}
    </HStack>;
}