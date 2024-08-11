import { Button, HStack, Text } from '@chakra-ui/react';
import Link from 'next/link';

export function Header() {
    return <HStack w='100%'>
        <Link href='/'><Button>На главную</Button></Link>
    </HStack>
}