import { Box, Flex, FlexProps, HStack, Icon, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { colors, positions } from '@/utils/misc';
import { Card, ChatBlock, Controls, Sum } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { PlayerStatus, SessionStage, SessionStatus } from '@/utils/enums';
import { FaUser } from 'react-icons/fa';
import { Fragment } from 'react';
import { useWs } from '@/contexts';

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

    return <Flex pos='relative' w={device !== 'phone' ? '60vw' : '90vw'} h={device !== 'phone' ? '50vh' : '70svh'} border='36px solid black' bg='#063605' rounded='full' justify='center' align='center'>
        <Box w='95%' h='90%' pos='absolute' top={0} left={0} transform='translate(2.5%, 5%)' rounded='full' border='2px solid black' />

        <VStack pos='fixed' bottom={0} right={0} spacing={0} align='end' fontSize='12px' p='10px' opacity={.5} pointerEvents='none'>
            <Text>ws status: <Text as='span' id='wsstatus' color='cyan' fontWeight={600}>unknown</Text></Text>
            <Text>user_id: {user?.uuid}</Text>
        </VStack>

        {game.seats.includes(user?.uuid) && <Box pos='fixed' bottom={0} left={0} zIndex={1}><ChatBlock /></Box>}
        {game.players.length >= 2 && <Box pos='fixed' bottom='30px' right='30px'><Controls /></Box>}

        {Array.from({ length: game.seats.length }, (_: any, i: number) => {
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

                <HStack
                    {...positions.players[i]}
                    {...SeatStyles}
                    bg={seatTaken ? (colors[i] + '33') : 'gray.700'}
                    opacity={seatOpacity}
                    userSelect='none'
                    p='24px 40px'
                    fontWeight={600}
                    spacing='14px'
                    rounded='15px'
                    pos='absolute'
                    justify='center'
                    align='center'
                    transition='0.2s'
                >
                    {player ? <>
                        {game.dealer === i && <Text pos='absolute' bottom='14px' right='11px'>d</Text>}

                        <Box pos='absolute' bottom={-8} right={0}>
                            <Sum color='orange'>{player.balance}</Sum>
                        </Box>

                        <Text w='max-content' color={colors[i]} fontSize='18px'>
                            {player.name}
                            <Text as='span' color='gray' opacity='.5'>{player.id === user?.uuid && ' (вы)'}</Text>
                        </Text>

                        <Box w='100%' h='100%' pos='absolute' top={0} left={0} rounded='10px' overflow='hidden'>
                            <Icon as={FaUser} w='40px' h='40px' color={colors[i]} pos='absolute' opacity={.25} bottom={-1} right={-1} />
                        </Box>

                        {game.status !== SessionStatus.LOBBY && <HStack h='30px' spacing='4px' pos='absolute' bottom='-60px' left='-0px'>
                            {player.status === PlayerStatus.PASS && <Flex {...PlayerLabelStyles} bg='red' color='white'>passed</Flex>}
                        </HStack>}

                        {player.id === user?.uuid && <HStack w='90px' h='60px' spacing='4px' pos='absolute' top='-70px'>
                            {player.hand.cards.map((card: any, i: number) => <Card key={i} i={i} data={card} />)}
                        </HStack>}
                    </> : <Text>занять</Text>}
                </HStack>
            </Fragment>;
        })}

        <VStack w='100%' spacing='12px'>
            <HStack spacing='10px' h='100px'>
                {/* #kostyl */}
                {game.board.cards
                    .map((card: any, i: number) => {
                        if (game.stage === SessionStage.PREFLOP) {
                            return undefined;
                        } else if (game.stage === SessionStage.FLOP) {
                            return i <= 2 ? card : undefined;
                        } else if (game.stage === SessionStage.RIVER) {
                            return i <= 3 ? card : undefined;
                        } else {
                            return card;
                        }
                    })
                    .map((card: any, i: number) => <Card key={i} i={i} data={card} />)}
            </HStack>

            {game.status === SessionStatus.LOBBY
                ? <>
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
