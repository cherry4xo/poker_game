import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IMessage, IUser } from '@/utils/types';

interface MiscState {
    device: string | null;
    user: IUser | null;
    loading: any;
    chat: IMessage[];
    href: string;
}

const initialState: MiscState = {
    device: null,
    user: null,
    loading: {},
    chat: [],
    href: ''
};

function decryptMsg(msg: string): IMessage {
    const [raw_datetime, player_id, username, text] = msg.split('::');

    let datetime: Date | string = new Date(raw_datetime);
    datetime = `${datetime.toLocaleTimeString('ru-RU')}`;

    return { datetime, player_id, username, text };
}

export const miscSlice = createSlice({
    name: 'misc',
    initialState,
    reducers: {
        setDevice: (state, action: PayloadAction<string>) => {
            state.device = action.payload;
        },
        setUser: (state, action: PayloadAction<IUser>) => {
            state.user = action.payload;
        },
        setLoading: (state, action: PayloadAction<string>) => {
            state.loading[action.payload as keyof typeof state.loading] = true;
        },
        clearUserSession: (state) => {
            if (state.user) state.user.session_id = null;
        },
        setChatHistory: (state, action: PayloadAction<string[]>) => {
            state.chat = action.payload.map(decryptMsg);
        },
        addChatMsg: (state, action: PayloadAction<string>) => {
            state.chat.push(decryptMsg(action.payload));
        },
        setHref: (state, action: PayloadAction<string>) => {
            state.href = action.payload;
        }
    }
});

export const { setDevice, setUser, setLoading, setChatHistory, addChatMsg, setHref } = miscSlice.actions;
export default miscSlice.reducer;