'use server';
import axios, { Method } from 'axios';
import { useContext } from 'react';
import { ISignup, IUser } from '@/utils/types';
import { SocketContext } from '@/app/SocketContext';
import { useDispatch } from '@/redux/hooks';
import { setGameState } from '@/redux/gameSlice';
import { setLoading, setUser } from '@/redux/miscSlice';
import { cookies } from 'next/headers';

const api = axios.create({
    baseURL: 'https://api.cherry4xo.ru',
    withCredentials: true
});

const authVar = 'poker_auth';

const dispatch = useDispatch();
const ws = useContext(SocketContext);

const cookieStore = cookies();

const auth = { token_type: '', refresh_token: '', access_token: '' };

console.log(cookieStore.get(authVar));

// const auth = JSON.parse(cookieStore.get(authVar) ?? JSON.stringify(initAuth));

const exec = async (
    { method, url, body = {}, headers = {}, onSuccess }:
        { method: Method, url: string, body?: any, headers?: any, onSuccess?: (data: any) => void }
) => {
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

        if (detail === 'Could not validate credentials') {
            signout();
            window.location.replace('/auth');
        } else console.error(err);

        return false;
    }
};

export const signin = async (payload: ISignup) => await exec({
    method: 'post',
    url: '/poker_auth/login/access-token',
    body: new URLSearchParams(payload as any).toString(),
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    },
    onSuccess(data) {
        cookieStore.set(authVar, JSON.stringify(data));
        window.location.href = '/';
    }
});

export const signout = async () => {
    cookieStore.delete(authVar);
    window.location.reload();
};

export const create = async () => await exec({
    method: 'post',
    url: '/poker_game/game/create',
    async onSuccess(data) {
        await exec({
            method: 'post',
            url: `/poker_game/game/join/${data.uuid}`,
            onSuccess() {
                window.location.href = '/game';
            }
        });
    }
});

export async function load(func: string) {
    dispatch(setLoading(func));

    if (func === 'create') await create();
    if (func === 'signout') signout();
}

export const validate = async () => {
    await exec({
        method: 'get',
        url: '/poker_auth/login/validate',
        onSuccess(data: IUser) {
            dispatch(setUser(data));
        }
    });
};

export const signup = async (payload: ISignup) => await exec({
    method: 'post',
    url: '/poker_users/users',
    body: payload,
    async onSuccess() {
        await signin({ username: payload.email, password: payload.password, email: '' });
    }
});

export const connect = async () => {
    if (ws.current) {
        ws.current.close();
        ws.current = null;
    }

    const socket = new WebSocket(`wss://api.cherry4xo.ru/poker_game/game/${auth.access_token}`);

    socket.onopen = () => {
        // @ts-ignore
        document.querySelector('#wsstatus').innerHTML = 'connected';
    };
    socket.onclose = () => {
        // @ts-ignore
        document.querySelector('#wsstatus').innerHTML = 'disconnected';
    };

    socket.onmessage = e => {
        const data = JSON.parse(JSON.parse(e.data));
        dispatch(setGameState(data));
    };

    ws.current = socket;
}
