'use server';
import { cookies } from 'next/headers';
import { IAuth } from '@/utils/types';

const authVar = 'poker_auth';

export async function getAuth() {
    try {
        const data = cookies().get(authVar);

        return JSON.parse(data?.value ?? JSON.stringify({ token_type: null, refresh_token: '', access_token: '' }));
    } catch (e) {
        console.error(e);
    }
}

export async function setAuth(payload: IAuth) {
    cookies().set(authVar, JSON.stringify(payload));
}

export async function deleteAuth() {
    cookies().delete(authVar);
}
