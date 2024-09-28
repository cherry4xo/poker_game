'use client';
import { IAuth } from '@/utils/types';

const authVar = 'auth';

export function hasAuth() {
    return !!localStorage.getItem(authVar);
}

export function getAuth() {
    const data = localStorage.getItem(authVar) ?? JSON.stringify({ token_type: null, refresh_token: '', access_token: '' });

    return JSON.parse(data);
}

export function setAuth(payload: IAuth) {
    localStorage.setItem(authVar, JSON.stringify(payload));
}

export function deleteAuth() {
    localStorage.removeItem(authVar);
}
