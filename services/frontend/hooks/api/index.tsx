import axios, { Method } from 'axios';
import { useToast } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import { ISignup } from '@/utils/types';

const api = axios.create({
    baseURL: 'https://api.cherry4xo.ru'
});

const localStorageName = 'poker_auth';

export function useApi() {
    const toast = useToast();

    const getAccessToken = useMemo(() => JSON.parse(localStorage.getItem(localStorageName) ?? '{}')?.access_token, []);
    const getUserData = useMemo(() => JSON.parse(localStorage.getItem('poker_user') ?? '{}'), []);

    const exec = useCallback(async (
        { method, url, body = {}, headers = {}, onSuccess }: { method: Method, url: string, body?: any, headers?: any, onSuccess?: (data: any) => void }
    ) => {
        try {
            const { data } = await api({
                method,
                url,
                data: body,
                headers: {
                    Authorization: `Bearer ${getAccessToken}`,
                    ...headers
                }
            });

            if (onSuccess) onSuccess(data);

            return true;
        } catch (err) {
            // @ts-ignore
            const detail = err.response.data.detail;

            if (detail === 'Could not validate credentials') {
                localStorage.removeItem(localStorageName);
                window.location.replace('/auth');
            } else toast({
                status: 'error',
                duration: 3000,
                title: 'Error',
                description: detail
            });

            return false;
        }
    }, []);

    return {
        authed: !!getAccessToken,
        user: getUserData,

        validate: async () => await exec({
            method: 'get',
            url: '/poker_auth/login/validate',
            onSuccess(data) {
                localStorage.setItem('poker_user', JSON.stringify(data));
            }
        }),

        signin: async (payload: ISignup) => await exec({
            method: 'post',
            url: '/poker_auth/login/access-token',
            body: new URLSearchParams(payload as any).toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            onSuccess(data) {
                localStorage.setItem(localStorageName, JSON.stringify(data));
                window.location.href = '/';

                toast({
                    status: 'success',
                    duration: 3000,
                    title: 'Успешно',
                    description: 'Вы вошли!'
                });
            }
        }),

        signup: async (payload: ISignup) => await exec({
            method: 'post',
            url: '/poker_users/users',
            body: payload,
            onSuccess() {
                toast({
                    status: 'success',
                    duration: 3000,
                    title: 'Успешно',
                    description: 'Вы зарегистрировались!'
                });
            }
        }),

        create: async () => await exec({
            method: 'post',
            url: '/poker_game/game/create',
            onSuccess(data) {
                window.location.href = `/game/${data.uuid}`;
            }
        })
    };
}
