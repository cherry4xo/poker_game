import { HStack } from '@chakra-ui/react';
import { AuthForm } from '@/components/Common';

export default function Auth() {
    return <HStack w='100%' justify='center'>
        <AuthForm />
        <AuthForm login />
    </HStack>
}
