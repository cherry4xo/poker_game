import { Box, Flex, FlexProps, HStack, Text } from '@chakra-ui/react';
import { positions } from '@/utils/misc';
import { Controls } from '@/components/Common';
import { useDispatch, useSelector } from '@/redux/hooks';
import { addPlayer } from '@/redux/gameSlice';
import { IPlayer } from '@/utils/types';

const PlayerLabelStyles: FlexProps = {
    w: 'max-content',
    h: '100%',
    px: '10px',
    rounded: '200px',
    justify: 'center',
    align: 'center'
};

export default function Game() {
    const dispatch = useDispatch();
    const game = useSelector(state => state.game);

    return <Flex pos='relative' w='60vw' h='40vh' border='2px solid green' borderRadius='full' justify='center' align='center'>
        <Text as='pre' fontSize='12px' pos='fixed' top={0} left={0} opacity={.5}>{JSON.stringify(game, null, 2)}</Text>
        {game.players.filter(p => p).length > 1 && <Box pos='fixed' bottom='30px' right='30px'><Controls /></Box>}

        {Array.from({ length: game.players.length }, (_: any, i: number) => {
            const player: IPlayer | null = game.players[i];

            return <Flex
                key={i}
                {...(game.status === 'starting' ? positions[i] : player.pos)}
                w='40px'
                h='40px'
                borderRadius='200px'
                pos='absolute'
                justify='center'
                align='center'
                {...(
                    !player && game.status === 'starting'
                        ? {
                            border: '2px solid gray',
                            _hover: {
                                cursor: 'pointer',
                                borderColor: 'blue'
                            },
                            onClick: () => {
                                dispatch(addPlayer(i));
                            }
                        }
                        : {
                            border: player ? (game.status !== 'starting' && game.current_player === i ? '2px solid yellow' : '2px solid red') : 'none'
                        }
                )}
            >
                <Text>{i}</Text>

                <HStack h='30px' spacing='4px' pos='absolute' bottom='-40px' left='-30px'>
                    {player && (
                        game.status !== 'starting'
                            ? (!player.passed
                                ? <>
                                    <Flex {...PlayerLabelStyles} bg='teal'>{player.bet}$</Flex>
                                    {game.dealer === i && <Flex {...PlayerLabelStyles} bg='white' color='black'>D</Flex>}
                                </>
                                : <Flex {...PlayerLabelStyles} bg='whiteAlpha.500'>passed</Flex>)
                            : <Flex {...PlayerLabelStyles} bg='orange'>bal: {player.balance}$</Flex>
                    )}
                </HStack>
            </Flex>;
        })}

        <Text>{game.bank}$</Text>
    </Flex>;
}
