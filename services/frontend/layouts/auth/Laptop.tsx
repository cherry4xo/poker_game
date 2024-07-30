import { HStack } from '@chakra-ui/react';
import { AuthForm } from '@/components/Common';
import { useApi } from '@/hooks';
import { useEffect } from 'react';

export default function Auth() {
    const { validate } = useApi();

    useEffect(() => {
        validate();
    }, []);

    return <HStack w='100%' justify='center'>
        <AuthForm />
        <AuthForm login />
    </HStack>
}
