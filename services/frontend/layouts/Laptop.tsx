import { Button, HStack, SimpleGrid, Spinner, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useApi } from '@/hooks';
import { useSelector } from '@/redux/hooks';
import { TbDeviceGamepad, TbEye, TbHomeDot } from 'react-icons/tb';
import { useState } from 'react';
import { Sum } from '@/components/Common';

export default function Home() {
    const { load } = useApi();
    const { user, loading, device } = useSelector(state => state.misc);

    const games = Array.from({ length: 1 });

    const [loadingGame, setLoadingGame] = useState(-1);

    return <>
        {!loading?.validate
            ? (user
                ? <VStack w='100%' py='10svh' spacing='50px'>
                    <Sum color='teal'>Poker Game</Sum>

                    {!!user.session_id && <VStack>
                        <Text fontSize='18px' fontWeight={600}>Вы уже в игре!</Text>
                        <Link href='/game'><Button colorScheme='yellow' leftIcon={<TbHomeDot />}>Вернуться в игру</Button></Link>
                    </VStack>}

                    <SimpleGrid columns={device !== 'phone' ? 2 : 1} spacing='14px' opacity={!!user.session_id ? .5 : 1} pointerEvents={!!user.session_id ? 'none' : 'auto'}>
                        {games.map((_: any, i: number) => <VStack key={i} p='30px' spacing='18px' rounded='10px' bg='whiteAlpha.100' justify='center' align='center'>
                            <HStack pos='relative' w={device !== 'phone' ? '400px' : '90vw'} h='200px' border='12px solid black' bg='#063605' spacing='20px' rounded='full' justify='center' align='center'>
                                <Text><b>0/4</b></Text>
                                <Sum color='orange'>0</Sum>
                            </HStack>

                            <HStack w='100%'>
                                <Button w='100%' isLoading={loadingGame === i} isDisabled={loadingGame > -1} colorScheme='yellow' leftIcon={<TbDeviceGamepad />} onClick={() => {
                                    setLoadingGame(i);
                                    load('create');
                                }}>Играть</Button>
                                <Button w='100%' isDisabled variant='outline' colorScheme='teal' leftIcon={<TbEye />}>Наблюдать</Button>
                            </HStack>
                        </VStack>)}
                    </SimpleGrid>
                </VStack>
                : <>
                    <Text>Вы не вошли в аккаунт</Text>
                    <Link href='/auth'><Button>Войти/зарегистрироваться</Button></Link>
                </>)
            : <Spinner />}
    </>;
}
