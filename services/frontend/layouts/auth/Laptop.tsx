'use client';
import { VStack, Text } from '@chakra-ui/react';
import { AuthForm } from '@/components/Common';
import { useState } from 'react';

export default function Auth() {
    const [login, setLogin] = useState(false);

    return <VStack w='100%' justify='center' spacing='24px'>
        <AuthForm login={login} />
        <Text fontSize='15px' _hover={{ opacity: .75, cursor: 'pointer' }} transition='0.1s' onClick={() => setLogin(s => !s)}>
            {login ? 'Нет аккаунта? Зарегистрироваться' : 'Есть аккаунт? Войти'}
        </Text>
    </VStack>
}
