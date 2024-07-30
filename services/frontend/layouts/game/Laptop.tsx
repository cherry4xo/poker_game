import { Box, Flex, FlexProps, HStack, Text } from '@chakra-ui/react';
import { positions } from '@/utils/misc';
import { Controls } from '@/components/Common';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { SessionStatus } from '@/utils/enums';
import { useWs } from '@/hooks';

// const PlayerLabelStyles: FlexProps = {
//     w: 'max-content',
//     h: '100%',
//     px: '10px',
//     rounded: '200px',
//     justify: 'center',
//     align: 'center'
// };

export default function Game() {
    const game = useSelector(state => state.game);
    const { take_seat } = useWs();

    return <Flex pos='relative' w='60vw' h='40vh' border='2px solid green' borderRadius='full' justify='center' align='center'>
        <Text as='pre' fontSize='12px' pos='fixed' top={0} left={0} opacity={.5}>{JSON.stringify(game, null, 2)}</Text>
        {game.players.filter(p => p).length > 1 && <Box pos='fixed' bottom='30px' right='30px'><Controls /></Box>}

        {Array.from({ length: game.seats.length }, (_: any, i: number) => {
            const seatTaken = !!game.seats[i];
            const player: IPlayer | null = game.players[i];

            let SeatStyles: FlexProps = {
                border: '2px solid gray',
                _hover: {
                    cursor: 'pointer',
                    borderColor: 'blue'
                },
                onClick: () => {
                    take_seat(i);
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

                {/*<HStack h='30px' spacing='4px' pos='absolute' bottom='-40px' left='-30px'>*/}
                {/*    {player && (*/}
                {/*        game.status !== SessionStatus.LOBBY*/}
                {/*            ? (player.status !== PlayerStatus.PASS*/}
                {/*                ? <>*/}
                {/*                    <Flex {...PlayerLabelStyles} bg='teal'>{player.currentbet}$</Flex>*/}
                {/*                    {game.dealer === i && <Flex {...PlayerLabelStyles} bg='white' color='black'>D</Flex>}*/}
                {/*                </>*/}
                {/*                : <Flex {...PlayerLabelStyles} bg='whiteAlpha.500'>passed</Flex>)*/}
                {/*            : <Flex {...PlayerLabelStyles} bg='orange'>bal: {player.balance}$</Flex>*/}
                {/*    )}*/}
                {/*</HStack>*/}
            </Flex>;
        })}

        <Text>{game.total_bet}$</Text>
    </Flex>;
}
