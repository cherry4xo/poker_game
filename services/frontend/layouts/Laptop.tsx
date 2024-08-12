import { Button, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useApi } from '@/hooks';
import { useSelector } from '@/redux/hooks';

export default function Home() {
    const { load } = useApi();
    const { user, loading } = useSelector(state => state.misc);

    return <VStack w='100%' justify='center'>
        {user
            ? <>
                <Text>Вы авторизованы как {user.email}</Text>
                <Button onClick={() => load('create')} isLoading={loading.create} colorScheme='teal'>Играть</Button>
                <Button onClick={() => load('signout')} isLoading={loading.signout} colorScheme='red'>Выйти из аккаунта</Button>
            </>
            : <>
                <Text>Вы не вошли в аккаунт</Text>
                <Link href='/auth'><Button>Войти/зарегистрироваться</Button></Link>
            </>}
    </VStack>;
}
