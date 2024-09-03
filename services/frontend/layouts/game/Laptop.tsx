import { Box, Button, Flex, FlexProps, HStack, Icon, IconButton, Input, StackProps, Text, useToast, VStack } from '@chakra-ui/react';
import { colors, positions } from '@/utils/misc';
import { ChatBlock, Controls, Header } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { PlayerStatus, SessionStatus } from '@/utils/enums';
import { useWs } from '@/app/SocketContext';
// @ts-ignore
import * as deck from '@letele/playing-cards';
import { FaUser } from 'react-icons/fa';
import { RiCoinFill } from 'react-icons/ri';
import { TbCirclePlus } from 'react-icons/tb';

const PlayerLabelStyles: StackProps = {
    w: 'max-content',
    h: '100%',
    px: '10px',
    rounded: '200px',
    justify: 'center',
    align: 'center'
};

function Card({ data }: { data: { rank: string, suit: string } | undefined }) {
    let TheCard = deck.B1;

    if (!!data) {
        const rank = !isNaN(parseInt(data.rank)) ? data.rank : data.rank[0].toUpperCase();
        const suit = data.suit[0].toUpperCase();
        TheCard = deck[`${suit}${rank}`] ?? deck.B2;
    }

    return <TheCard style={{ width: '100%', height: '100%' }} />;
}

export default function Game() {
    const game = useSelector(state => state.game);
    const { user } = useSelector(state => state.misc);
    const ws = useWs();
    const toast = useToast();

    return <Flex pos='relative' w='60vw' h='45vh' border='36px solid black' bg='#063605' rounded='full' justify='center' align='center'>
        <Box w='100%' pos='fixed' top={0} left={0} p='20px'><Header /></Box>
        <Box w='95%' h='90%' pos='absolute' top={0} left={0} transform='translate(2.5%, 5%)' rounded='full' border='2px solid black' />
        {game.seats.includes(user?.uuid) && <Box pos='fixed' bottom={0} left={0}><ChatBlock /></Box>}
        {game.players.length >= 2 && <Box pos='fixed' bottom='30px' right='30px'><Controls /></Box>}

        <VStack spacing={0} align='end' fontSize='12px' pos='fixed' top={0} right={0} p='10px' opacity={.5}>
            <Text>game_id: {game.id}</Text>
            <Text>user_id: {user?.uuid}</Text>
            <Text id='wsstatus'>disconnected</Text>
        </VStack>

        {Array.from({ length: game.seats.length }, (_: any, i: number) => {
            const seatTaken = !!game.seats[i];
            const player: IPlayer | undefined = game.players.find((p: IPlayer) => p.id === game.seats[i]);

            let SeatStyles: FlexProps = {
                border: '2px solid rgba(255,255,255,.2)',
                _hover: {
                    cursor: 'pointer',
                    borderColor: 'blue'
                },
                onClick: () => {
                    ws.current.send(JSON.stringify({ type: 'take_seat', seat_num: i }));
                }
            };

            if (game.status === SessionStatus.LOBBY) {
                if (seatTaken) SeatStyles = { border: '2px solid ' + colors[i] };
            } else {
                if (!seatTaken) SeatStyles = { display: 'none' };
                else SeatStyles = { border: '2px solid ' + colors[i] };
            }

            return <HStack
                key={i}
                {...positions[i]}
                {...SeatStyles}
                bg={seatTaken ? 'gray.800' : 'gray.700'}
                userSelect='none'
                p='14px 40px'
                rounded='15px'
                pos='absolute'
                justify='center'
                align='center'
                transition='0.2s'
            >
                {player ? <>
                    <Text w='max-content'>{player.name} <span style={{ opacity: .5 }}>{player.id === user?.uuid && '(вы)'}</span></Text>

                    <Box w='100%' h='100%' pos='absolute' top={0} left={0} rounded='10px' overflow='hidden'>
                        <Icon as={FaUser} w='40px' h='40px' pos='absolute' opacity={.25} bottom={-1} right={-1} />
                    </Box>

                    <HStack pos='absolute' bottom='-30px' right={0} spacing={1} color='orange' opacity={.85}>
                        <Text>{player.balance}</Text>
                        <Icon as={RiCoinFill} w='20px' h='20px' />
                    </HStack>

                    {game.current_player === i && <Text pos='absolute' bottom='40px'>ходит</Text>}

                    <HStack h='30px' spacing='4px' pos='absolute' bottom='-40px'>
                        {game.status !== SessionStatus.LOBBY &&
                            (player.status !== PlayerStatus.PASS
                                ? <>
                                    <Flex {...PlayerLabelStyles} bg='teal'>{player.currentbet}$</Flex>
                                    {game.dealer === i && <Flex {...PlayerLabelStyles} bg='white' color='black'>дилер</Flex>}
                                </>
                                : <Flex {...PlayerLabelStyles} bg='whiteAlpha.500'>passed</Flex>)}
                    </HStack>

                    <HStack w='90px' h='60px' spacing='4px' pos='absolute' bottom='-110px'>
                        {player.hand.cards.map((card: any, i: number) => <Card key={i} data={player.id === user?.uuid ? card : undefined} />)}
                    </HStack>
                </> : <Text>занять</Text>}
            </HStack>;
        })}

        <VStack w='100%' spacing='12px'>
            <HStack spacing='10px' h='100px'>
                {game.board.cards.map((card: any, i: number) => <Card key={i} data={card} />)}
            </HStack>

            {game.status === SessionStatus.LOBBY
                ? <>
                    <Text>Ожидаем игроков...</Text>
                    <Input w='50%' opacity={.75} onFocus={(e: any) => e.target.select()} value={'http://217.28.221.254:33010/join/' + game.id} />
                    {/*<Button px='50px' rounded='200px' leftIcon={<TbCirclePlus />} isDisabled onClick={() => {*/}
                    {/*    toast({*/}
                    {/*        status: 'info',*/}
                    {/*        description: 'Ссылка скопирована в буфер обмена! Отправьте её другу!',*/}
                    {/*        duration: 3000,*/}
                    {/*        isClosable: true*/}
                    {/*    });*/}
                    {/*}}>Пригласить друга</Button>*/}
                    <Text fontSize='13px' opacity={.75}>Скопируйте и отправьте друзьям ссылку на игру!</Text>
                </>
                : <Text>{game.total_bet}$</Text>}
        </VStack>
    </Flex>;
}
