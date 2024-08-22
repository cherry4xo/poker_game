import { Box, Flex, FlexProps, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import { positions } from '@/utils/misc';
import { ChatBlock, Controls, Header } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { PlayerStatus, SessionStatus } from '@/utils/enums';
import { useWs } from '@/app/SocketContext';
// @ts-ignore
import * as deck from '@letele/playing-cards';

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

    return <Flex pos='relative' w='60vw' h='40vh' border='2px solid green' borderRadius='full' justify='center' align='center'>
        <Box w='100%' pos='fixed' top={0} left={0} p='20px' opacity={.75}><Header /></Box>
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
                border: '2px solid gray',
                _hover: {
                    cursor: 'pointer',
                    borderColor: 'blue'
                },
                onClick: () => {
                    ws.current.send(JSON.stringify({ type: 'take_seat', seat_num: i }));
                }
            };

            if (game.status === SessionStatus.LOBBY) {
                if (seatTaken) SeatStyles = { border: '2px solid red' };
            } else {
                if (!seatTaken) SeatStyles = { display: 'none' };
                else SeatStyles = { border: '2px solid red' };
            }

            return <VStack
                key={i}
                {...positions[i]}
                {...SeatStyles}
                userSelect='none'
                p='6px 16px'
                borderRadius='200px'
                pos='absolute'
                justify='center'
                align='center'
                transition='0.2s'
            >
                {player ? <>
                    {game.current_player === i && <Text pos='absolute' bottom='40px'>ходит</Text>}

                    <Text w='max-content'>{player.name} <span style={{ opacity: .5 }}>{player.id === user?.uuid && '(вы)'}</span></Text>

                    <HStack h='30px' spacing='4px' pos='absolute' bottom='-40px'>
                        {game.status !== SessionStatus.LOBBY
                            ? (player.status !== PlayerStatus.PASS
                                ? <>
                                    <Flex {...PlayerLabelStyles} bg='teal'>{player.currentbet}$</Flex>
                                    {game.dealer === i && <Flex {...PlayerLabelStyles} bg='white' color='black'>дилер</Flex>}
                                </>
                                : <Flex {...PlayerLabelStyles} bg='whiteAlpha.500'>passed</Flex>)
                            : <Flex {...PlayerLabelStyles} bg='orange'>bal: {player.balance}$</Flex>}
                    </HStack>

                    <HStack w='90px' h='60px' spacing='4px' pos='absolute' bottom='-110px'>
                        {player.hand.cards.map((card: any, i: number) => <Card key={i} data={player.id === user?.uuid ? card : undefined} />)}
                    </HStack>
                </> : <Text>занять</Text>}
            </VStack>;
        })}

        <VStack w='100%'>
            <HStack spacing='10px' h='100px'>
                {game.board.cards.map((card: any, i: number) => <Card key={i} data={card} />)}
            </HStack>

            {game.status === SessionStatus.LOBBY
                ? <Text>Ожидаем игроков...</Text>
                : <Text>{game.total_bet}$</Text>}
        </VStack>
    </Flex>;
}
