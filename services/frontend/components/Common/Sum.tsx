import { HStack, Icon, Text } from '@chakra-ui/react';
import { RiCoinFill } from 'react-icons/ri';

export function Sum({ children, color }: any) {
    return <HStack transform='translateY(1px)' spacing={1} color={color} opacity={.85}>
        <Text fontWeight={600}>{children}</Text>
        <Icon as={RiCoinFill} w='25px' h='25px' />
    </HStack>;
}
