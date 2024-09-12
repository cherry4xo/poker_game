import { createContext, useContext } from 'react';
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, useDisclosure } from '@chakra-ui/react';
import { useSelector } from '@/redux/hooks';
import { IPlayer } from '@/utils/types';
import { colors } from '@/utils/misc';

export const WinnersModalContext = createContext(null as any);

export function WinnersModalProvider({ children }: { children: React.ReactNode }) {
    const game = useSelector(state => state.game);
    const state = useDisclosure();

    return <WinnersModalContext.Provider value={state}>
        <Modal isOpen={state.isOpen} onClose={state.onClose} isCentered>
            <ModalOverlay />
            <ModalContent bg='gray.800' color='white'>
                <ModalHeader>Победители</ModalHeader>
                <ModalCloseButton />

                {game?.winners && <ModalBody>
                    {game.winners
                        .map((n: number) => ({ color: colors[n], player: game.players.find((p: IPlayer) => p.id === game.seats[n]) }))
                        .map((p: any, i: number) => <Text key={i} color={p.color}>- {p.player.name}</Text>)}
                </ModalBody>}
            </ModalContent>
        </Modal>

        {children}
    </WinnersModalContext.Provider>;
}

export function useWinnersModal() {
    const context = useContext(WinnersModalContext);
    if (!context) throw new Error('Use app context within provider!');
    return context;
}
