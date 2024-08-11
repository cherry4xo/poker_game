import { Box, Flex, FlexProps, HStack, Text, VStack } from '@chakra-ui/react';
import { positions } from '@/utils/misc';
import { Controls, Header } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { PlayerStatus, SessionStatus } from '@/utils/enums';
import { useContext } from 'react';
import { SocketContext } from '@/app/SocketContext';
import { useApi } from '@/hooks';
// @ts-ignore
import * as deck from '@letele/playing-cards';

const PlayerLabelStyles: FlexProps = {
    w: 'max-content',
    h: '100%',
    px: '10px',
    rounded: '200px',
    justify: 'center',
    align: 'center'
};

function Card({ data }: { data: { rank: string, suit: string } }) {
    const rank = !isNaN(parseInt(data.rank)) ? data.rank : data.rank[0].toUpperCase();
    const suit = data.suit[0].toUpperCase();

    const TheCard = deck[`${suit}${rank}`] ?? deck.B2;
    return <TheCard style={{ width: '100%', height: '100%' }} />;
}

export default function Game() {
    const game = useSelector(state => state.game);
    const ws = useContext(SocketContext);

    const { user } = useApi();
    const { device } = useSelector(state => state.misc);

    return <Flex pos='relative' w='60vw' h='40vh' border='2px solid green' borderRadius='full' justify='center' align='center'>
        <Box w='100%' pos='fixed' top={0} left={0} p='20px' opacity={.75}><Header /></Box>
        {/*{device !== 'phone' && <Text as='pre' fontSize='12px' pos='fixed' top={0} left={0} opacity={.5}>{JSON.stringify(game, null, 2)}</Text>}*/}
        {/*<Text fontSize='12px' pos='fixed' top={0} right={0} opacity={.5}>{user.uuid}</Text>*/}
        {game.players.filter(p => p).length > 1 && <Box pos='fixed' bottom='30px' right='30px'><Controls /></Box>}

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
                else if (game.current_player === i) SeatStyles = { border: '2px solid yellow' };
                else SeatStyles = { border: '2px solid red' };
            }

            return <Flex
                key={i}
                {...positions[i]}
                {...SeatStyles}
                w='40px'
                h='40px'
                borderRadius='200px'
                pos='absolute'
                justify='center'
                align='center'
            >
                <Text>{i}</Text>

                <HStack h='30px' spacing='4px' pos='absolute' bottom='-40px' left='-30px'>
                    {player && <>
                        <Flex {...PlayerLabelStyles} bg='gray'>{player.name}</Flex>

                        {game.status !== SessionStatus.LOBBY
                            ? (player.status !== PlayerStatus.PASS
                                ? <>
                                    <Flex {...PlayerLabelStyles} bg='teal'>{player.currentbet}$</Flex>
                                    {game.dealer === i && <Flex {...PlayerLabelStyles} bg='white' color='black'>D</Flex>}
                                </>
                                : <Flex {...PlayerLabelStyles} bg='whiteAlpha.500'>passed</Flex>)
                            : <Flex {...PlayerLabelStyles} bg='orange'>bal: {player.balance}$</Flex>}
                    </>}
                </HStack>
            </Flex>;
        })}

        <VStack w='100%'>
            <HStack spacing='10px' h='40px'>
                {game.board.cards.map((card: any, i: number) => <Card key={i} data={card} />)}
            </HStack>

            <Text>{game.total_bet}$</Text>
        </VStack>
    </Flex>;
}
