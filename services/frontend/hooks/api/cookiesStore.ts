'use server';
import { cookies } from 'next/headers';
import { IAuth } from '@/utils/types';

const authVar = 'poker_auth';

export async function getAuth() {
    const data = cookies().get(authVar);

    return new Promise(resolve =>
        resolve(JSON.parse(data?.value ?? JSON.stringify({ token_type: null, refresh_token: '', access_token: '' })))
    );
}

export async function setAuth(payload: IAuth) {
    cookies().set(authVar, JSON.stringify(payload));
}

export async function deleteAuth() {
    cookies().delete(authVar);
}
