import { Button, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useApi } from '@/hooks';

export default function Home() {
    const { authed, create, user } = useApi();

    return <VStack w='100%' justify='center'>
        {authed
            ? <>
                <Text>Вы авторизованы как {user.email}</Text>
                <Button onClick={create}>Создать игру</Button>
            </>
            : <>
                <Text>Вы не вошли в аккаунт</Text>
                <Link href='/auth'><Button>Войти/зарегистрироваться</Button></Link>
            </>}
    </VStack>;
}
