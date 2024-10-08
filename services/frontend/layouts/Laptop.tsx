import { Box, Button, HStack, IconButton, Input, Spinner, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useApi } from '@/hooks';
import { useSelector } from '@/redux/hooks';
import { TbDeviceGamepad, TbHomeDot } from 'react-icons/tb';
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

                    {/*<SimpleGrid columns={device !== 'phone' ? 2 : 1} spacing='14px' opacity={!!user.session_id ? .5 : 1} pointerEvents={!!user.session_id ? 'none' : 'auto'}>*/}
                    <VStack opacity={!!user.session_id ? .5 : 1} p='30px' spacing='18px' rounded='10px' bg='whiteAlpha.100' justify='center' align='center' pos='relative'>

                        <HStack pos='relative' fontSize='20px' w={device !== 'phone' ? '520px' : '90vw'} h='400px' border='12px solid #2d3468' outline='12px solid #2d3468' bg='#6fb188' boxShadow='0 14px 0 0 #2d3468' spacing='20px' rounded='full' justify='center' align='center'>
                            <Box w='92%' h='90%' zIndex={1} pos='absolute' top='50%' left='50%' transform='translate(-50%, -50%)' rounded='full' border='6px solid white' outline='20px solid #87a0f0' />

                            <VStack zIndex={2}>
                                {/*<HStack>*/}
                                {/*    <Text><b>0/4</b></Text>*/}
                                {/*    <Sum color='orange'>0</Sum>*/}
                                {/*</HStack>*/}

                                <HStack w='100%'>
                                    <Button w='100%' isLoading={loadingGame === 0} isDisabled={loadingGame > -1 || !!user.session_id} colorScheme='yellow' leftIcon={<TbDeviceGamepad />} onClick={() => {
                                        setLoadingGame(0);
                                        load('create');
                                    }}>Создать игру</Button>
                                    {/*<Button w='100%' isDisabled variant='outline' colorScheme='teal' leftIcon={<TbEye />}>Наблюдать</Button>*/}
                                </HStack>
                            </VStack>
                        </HStack>
                    </VStack>
                    {/*</SimpleGrid>*/}

                    {user.session_id && <VStack mt='150px' opacity={!!user.session_id ? .5 : 1}>
                        <Text fontWeight={600}>Приватная игра</Text>
                        <HStack>
                            <Input placeholder='введите ключ' />
                            <IconButton isDisabled={!!user.session_id} aria-label='join' colorScheme='yellow' icon={<TbDeviceGamepad />} />
                        </HStack>
                    </VStack>}
                </VStack>
                : <>
                    <Text>Вы не вошли в аккаунт</Text>
                    <Link href='/auth'><Button>Войти/зарегистрироваться</Button></Link>
                </>)
            : <Spinner />}
    </>;
}
