'use client';
import { Button, Spinner, Text, VStack } from '@chakra-ui/react';
import { TbDoorExit } from 'react-icons/tb';
import { useSelector } from '@/redux/hooks';
import { useApi } from '@/hooks';

export default function Me() {
    const { load } = useApi();
    const { user, loading } = useSelector(state => state.misc);

    return user
        ? <VStack w='100%' justify='center'>
            <Text>Вы авторизованы как {user.email}</Text>
            <Button onClick={() => load('signout')} isLoading={loading.signout} colorScheme='red' leftIcon={<TbDoorExit />}>Выйти из аккаунта</Button>
        </VStack>
        : <Spinner />;
}
