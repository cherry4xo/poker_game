import { createContext, useContext } from 'react';
import { HStack, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, useDisclosure } from '@chakra-ui/react';
import { useSelector } from '@/redux/hooks';
import { Header } from '@/components/Common';
import { IPlayer } from '@/utils/types';

export const WinnersModalContext = createContext(null as any);

export function WinnersModalProvider({ children }: { children: React.ReactNode }) {
    const game = useSelector(state => state.game);
    const state = useDisclosure();

    return <WinnersModalContext.Provider value={state}>
        <Modal isOpen={state.isOpen} onClose={state.onClose}>
            <ModalOverlay />
            <ModalContent bg='gray.800' color='white'>
                <ModalHeader>Конец игры</ModalHeader>
                <ModalCloseButton />
                {game?.winners && <ModalBody>
                    <Text as='pre' fontSize='13px'>{JSON.stringify(game.winners.map((n: number) => game.players.find((p: IPlayer) => p.id === game.seats[n])), null, 2)}</Text>
                </ModalBody>}

                <ModalFooter>
                    <HStack w='100%' justify='center'>
                        <Header />
                    </HStack>
                </ModalFooter>
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
