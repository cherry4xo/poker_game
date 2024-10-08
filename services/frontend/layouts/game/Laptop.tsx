import { Box, Button, Flex, FlexProps, HStack, Icon, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { colors, positions } from '@/utils/misc';
import { Card, ChatBlock, Controls, Sum } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { PlayerStatus, SessionStage, SessionStatus } from '@/utils/enums';
import { FaUser } from 'react-icons/fa';
import { Fragment } from 'react';
import { useWs } from '@/contexts';
import { TbDeviceGamepad } from 'react-icons/tb';

const PlayerLabelStyles: StackProps = {
    w: 'max-content',
    h: '100%',
    px: '10px',
    rounded: '200px',
    justify: 'center',
    align: 'center'
};

export default function Game() {
    const game = useSelector(state => state.game);
    const { user, href, device } = useSelector(state => state.misc);
    const ws = useWs();

    return <Flex pos='relative' w='70vw' h={device !== 'phone' ? '80svh' : '80svh'} border='36px solid #4c5ba1' bg='#6fb188' boxShadow='0 0 10px 10px rgba(0,0,0,1) inset' rounded='full' justify='center' align='center'>
        <Box w='95%' h='90%' pos='absolute' top={0} left={0} transform='translate(2.5%, 5%)' rounded='full' border='6px solid white' boxShadow='0 0 10px 10px rgba(0,0,0,1) inset' outline='20px solid #889fef' />
        {/*<Box w='107%' h='115%' pos='absolute' zIndex={5} top={0} left={0} transform='translate(-3%, -7%)' boxShadow='0 0 10px 10px rgba(0,0,0,.5)' rounded='full' border='36px solid #4c5ba1' />*/}

        {/*{device !== 'phone' && <VStack pos='fixed' bottom={0} right={0} spacing={0} align='end' fontSize='12px' p='10px' opacity={.5} pointerEvents='none'>*/}
        {/*    <Text>ws status: <Text as='span' id='wsstatus' color='cyan' fontWeight={600}>unknown</Text></Text>*/}
        {/*    <Text>user_id: {user?.uuid}</Text>*/}
        {/*</VStack>}*/}

        {game.seats.includes(user?.uuid) && <Box pos='fixed' bottom={0} left={0} zIndex={1}><ChatBlock /></Box>}
        {game.players.length >= 2 && <Box pos='fixed' bottom='20px' right='30px'><Controls /></Box>}

        {Array.from({ length: game.seats.length - 1 }, (_: any, i: number) => {
            const seatTaken = !!game.seats[i];
            const seatOpacity = game.status === SessionStatus.LOBBY || game.current_player === i ? 1 : .5;
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

            return <Fragment key={i}>
                {player && game.status === SessionStatus.GAME && <Box {...positions.bets[i]} pos='absolute' opacity={seatOpacity}>
                    <Sum color={colors[i]}>{player?.currentbet}</Sum>
                </Box>}

                {player && game.current_player === i &&
                    <Box pos='absolute' {...positions.dots[i]} bg='white' w='20px' h='20px' rounded='200px' pointerEvents='none' />}

                {player && <HStack
                    {...positions.players[i]}
                    {...SeatStyles}
                    bg='gray.700'
                    color={seatTaken ? colors[i] : 'gray.400'}
                    opacity={seatOpacity}
                    userSelect='none'
                    p={device !== 'phone' ? '12px 40px' : '12px 20px'}
                    fontSize={device !== 'phone' ? '20px' : '16px'}
                    fontWeight={600}
                    spacing='14px'
                    rounded='200px'
                    pos='absolute'
                    justify='center'
                    align='center'
                    transition='0.2s'
                >
                    {game.dealer === i && <Text pos='absolute' bottom='14px' right='11px'>d</Text>}

                    {game.status === SessionStatus.LOBBY && <Box pos='absolute' bottom={-8} left='20%'>
                        <Sum color='orange'>{player.balance}</Sum>
                    </Box>}

                    <Text w='max-content' color={colors[i]}>
                        {player.name}
                        <Text as='span' color='gray' opacity='.5'>{player.id === user?.uuid && ' (вы)'}</Text>
                    </Text>

                    <Box w='100%' h='100%' pos='absolute' top={0} left={0} rounded='200px' overflow='hidden'>
                        <Icon as={FaUser} w={device !== 'phone' ? '40px' : '30px'} h={device !== 'phone' ? '40px' : '30px'} color={colors[i]} pos='absolute' opacity={.25} bottom={-1} right={-1} />
                    </Box>

                    {game.status !== SessionStatus.LOBBY && <HStack h='30px' spacing='4px' pos='absolute' bottom='-60px' left='-0px'>
                        {player.status === PlayerStatus.PASS && <Flex {...PlayerLabelStyles} bg='red' color='white'>passed</Flex>}
                    </HStack>}

                    <HStack w={device !== 'phone' ? '80px' : '50px'} h={device !== 'phone' ? '100px' : '70px'} spacing='4px' pos='absolute' top={device !== 'phone' ? '-90px' : '-66px'} left='20%'>
                        {player.hand.cards
                            .map((card: any) => {
                                if (player.id === user?.uuid || game.stage === SessionStage.SHOWDOWN) {
                                    return card;
                                } else {
                                    return undefined;
                                }
                            })
                            .map((card: any, i: number) => <Card key={i} i={i} data={card} props={{ position: 'absolute', transform: `translate(${20 * i}px, ${3 * i}px) rotate(${-10 + 15 * i}deg)` }} />)}
                    </HStack>
                </HStack>}
            </Fragment>;
        })}

        <VStack w='100%' spacing='12px'>
            <HStack spacing='10px' h={device !== 'phone' ? '100px' : '60px'}>
                {/* #kostyl */}
                {game.board.cards
                    .map((card: any, i: number) => {
                        if (game.stage === SessionStage.PREFLOP) {
                            return undefined;
                        } else if (game.stage === SessionStage.FLOP) {
                            return i <= 2 ? card : undefined;
                        } else if (game.stage === SessionStage.TURN) {
                            return i <= 3 ? card : undefined;
                        } else if (game.stage === SessionStage.RIVER) {
                            return i <= 4 ? card : undefined;
                        } else {
                            return card;
                        }
                    })
                    .map((card: any, i: number) => <Card key={i} i={i} data={card} />)}
            </HStack>

            {game.status === SessionStatus.LOBBY
                ? <>
                    <Button px='40px' leftIcon={<TbDeviceGamepad />} isDisabled={game.seats.includes(user?.uuid)} colorScheme='purple' onClick={() => ws.current.send(JSON.stringify({ type: 'take_seat', seat_num: game.seats.indexOf(null) }))}>{!game.seats.includes(user?.uuid) ? 'Занять место' : `Занято место №${game.seats.indexOf(user?.uuid) + 1}`}</Button>
                    <Text>Ожидаем игроков...</Text>
                    <Input w='50%' opacity={.75} onFocus={(e: any) => e.target.select()} readOnly value={`${href}/join/${game.id}`} />
                    <Text fontSize='13px' opacity={.75}>Скопируйте и отправьте друзьям ссылку на игру!</Text>
                </>
                : <HStack spacing='50px'>
                    <Sum color='orange'>{game.total_bet}</Sum>

                    <Text fontWeight={500}>Ходит: <Text as='span' fontSize='20px' fontWeight={500} color={colors[game.current_player ?? 0]}>{game.players.find((p: IPlayer) => p.id === game.seats[game.current_player ?? 0])?.name}</Text></Text>
                </HStack>}
        </VStack>
    </Flex>;
}
