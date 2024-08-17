'use client';
import { Button, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { useContext, useState } from 'react';
import { SocketContext } from '@/app/SocketContext';
import { useSelector } from '@/redux/hooks';
import { IMessage } from '@/utils/types';

export function ChatBlock() {
    const ws = useContext(SocketContext);
    const [text, setText] = useState('');
    const { chat } = useSelector(state => state.misc);

    return <VStack p='20px' rounded='10px'>
        <VStack w='100%'>
            {chat.map((msg: IMessage, i: number) => <HStack key={i} w='100%' justify='start' spacing='10px'>
                <Text opacity={.5}>{msg.datetime}</Text>
                <Text color='orange'>{msg.username}</Text>
                <Text>{msg.text}</Text>
            </HStack>)}
        </VStack>

        <HStack w='100%' opacity={.75}>
            <Input placeholder='Сообщение' value={text} onChange={(e: any) => {
                if (e.target.value.length <= 100) setText(e.target.value);
            }} />
            <Button
                onClick={() => {
                    ws.current.send(JSON.stringify({ type: 'new_message', message: text }));
                    setText('');
                }}
            >Send</Button>
        </HStack>
    </VStack>;
}
