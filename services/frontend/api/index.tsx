import axios, { Method } from 'axios';
import { useToast } from '@chakra-ui/react';
import { useDispatch } from '@/redux/hooks';
import { useCallback } from 'react';

const api = axios.create({
    baseURL: 'https://api.cherry4xo.ru/poker'
});

interface ISuccess {
    ok: true;
    results: any;
}

interface IError {
    ok: false;
    error: string;
}

const localStorageName = 'poker_token';

export function useApi() {
    const dispatch = useDispatch();
    const toast = useToast();

    const getToken = useCallback(() => {
        return localStorage.getItem(localStorageName) ?? '';
    }, []);

    const exec = useCallback(async (
        { method, url, body, onSuccess }: { method: Method, url: string, body?: any, onSuccess?: (data: ISuccess) => void }
    ) => {
        try {
            const { data, ...rest }: { data: ISuccess | IError } = await api({
                method,
                url,
                data: body,
                headers: {
                    Authorization: `Bearer ${getToken()}`
                }
            });

            console.log({ data, ...rest });

            if (data.ok && !('error' in data) && onSuccess) onSuccess(data);
            else if (!data.ok) toast({
                status: 'error',
                duration: 3000,
                title: 'Ошибка',
                description: data?.error?.toString()
            });

            return data.ok;
        } catch (err) {
            toast({
                status: 'error',
                duration: 3000,
                title: 'Request error',
                // @ts-ignore
                description: err?.stack?.toString()
            });

            return false;
        }
    }, []);

    return {
        test: async () => await exec({
            method: 'get',
            url: '/',
            onSuccess(data: ISuccess) {
                console.log('done');
            }
        })
    };
}
