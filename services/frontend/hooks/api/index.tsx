'use client';
import axios, { Method } from 'axios';
import { useToast } from '@chakra-ui/react';
import { useCallback } from 'react';
import { ISignup, IUser } from '@/utils/types';
import { useWs } from '@/app/SocketContext';
import { useDispatch } from '@/redux/hooks';
import { setGameState } from '@/redux/gameSlice';
import { addChatMsg, setChatHistory, setLoading, setUser } from '@/redux/miscSlice';
import { deleteAuth, getAuth, setAuth } from './cookiesStore';
import { usePathname } from 'next/navigation';

const api = axios.create({
    baseURL: 'https://api.cherry4xo.ru'
});

export function useApi() {
    const toast = useToast();
    const dispatch = useDispatch();
    const pathname = usePathname();
    const ws = useWs();

    const exec = useCallback(async (
        { method, url, body = {}, headers = {}, onSuccess }:
            { method: Method, url: string, body?: any, headers?: any, onSuccess?: (data: any) => void }
    ) => {
        const auth = await getAuth();

        try {
            const Authorization = !!auth.token_type ? `${auth.token_type.charAt(0).toUpperCase() + auth.token_type.slice(1)} ${auth.access_token}` : '';

            const { data } = await api({
                method,
                url,
                data: body,
                headers: { Authorization, ...headers }
            });

            if (onSuccess) onSuccess(data);

            return true;
        } catch (err) {
            // @ts-ignore
            const detail = err?.response?.data?.detail ?? 'unknown error';
            // @ts-ignore
            const code = err?.status ?? 401;

            if (code === 401) {
                if (pathname !== '/') signout();
            } else toast({
                status: 'error',
                duration: 3000,
                title: 'Error',
                description: detail
            });

            return false;
        }
    }, []);

    const signin = useCallback(async (payload: ISignup) => await exec({
        method: 'post',
        url: '/poker_auth/login/access-token',
        body: new URLSearchParams(payload as any).toString(),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        onSuccess(data) {
            setAuth(data);
            window.location.href = '/';

            toast({
                status: 'success',
                duration: 3000,
                title: 'Успешно',
                description: 'Вы вошли!'
            });
        }
    }), []);

    const signup = useCallback(async (payload: ISignup) => await exec({
        method: 'post',
        url: '/poker_users/users',
        body: payload,
        onSuccess() {
            window.location.reload();
            toast({
                status: 'success',
                title: 'Успешно',
                description: 'Вы зарегистрированы!'
            });
        }
    }), []);

    const signout = useCallback(() => {
        deleteAuth().then(() => window.location.href = '/');
    }, []);

    const join = useCallback(async (game_id: string) => await exec({
        method: 'post',
        url: `/poker_game/game/join/${game_id}`,
        onSuccess() {
            window.location.href = '/game';
        }
    }), []);

    const create = useCallback(async () => await exec({
        method: 'post',
        url: '/poker_game/game/create',
        async onSuccess(data) {
            await join(data.uuid);
        }
    }), []);

    const connect = useCallback(async () => {
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

        const auth = await getAuth();
        const socket = new WebSocket(`wss://api.cherry4xo.ru/poker_game/game/${auth.access_token}`);

        const pStatus = document.querySelector('#wsstatus');

        socket.onopen = () => {
            if (pStatus) pStatus.innerHTML = 'connected';
        };
        socket.onclose = () => {
            if (pStatus) pStatus.innerHTML = 'disconnected';
            setTimeout(connect, 1000);
        };

        socket.onmessage = e => {
            const data = JSON.parse(JSON.parse(e.data));
            console.log(new Date().toLocaleTimeString('ru-RU'), data);

            function scrollChat() {
                setTimeout(() => {
                    const objDiv = document.querySelector('#chatList');
                    if (objDiv) objDiv.scrollTop = objDiv.scrollHeight;
                }, 200);
            }

            if (data?.type === 'chat_history') {
                dispatch(setChatHistory(data.payload));
                scrollChat();
            } else if (data?.type === 'chat_incoming') {
                dispatch(addChatMsg(data.payload));
                scrollChat();
            } else dispatch(setGameState(data));
        };

        ws.current = socket;
    }, []);

    return {
        async load(func: string) {
            dispatch(setLoading(func));

            if (func === 'create') await create();
            if (func === 'signout') signout();
        },

        validate: async () => await exec({
            method: 'get',
            url: '/poker_game/game/validate',
            onSuccess(data: IUser) {
                dispatch(setUser(data));
            }
        }),

        signin,
        signup,
        signout,
        create,
        join,
        connect
    };
}
