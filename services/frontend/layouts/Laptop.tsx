import { Button, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { useApi } from '@/hooks';

export default function Home() {
    const { authed, create } = useApi();

    return <VStack w='100%' justify='center'>
        {authed
            ? <>
                <Button onClick={create}>create game</Button>
            </>
            : <>
                <Link href='/auth'><Button>auth</Button></Link>
            </>}
    </VStack>;
}
