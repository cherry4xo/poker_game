import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IMessage, IUser } from '@/utils/types';

interface MiscState {
    device: string | null;
    user: IUser | null;
    loading: any;
    chat: IMessage[];
    href: string;
    typing: string[];
}

const initialState: MiscState = {
    device: null,
    user: null,
    loading: { validate: true },
    chat: [],
    href: '',
    typing: []
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
        stopLoading: (state, action: PayloadAction<string | undefined>) => {
            if (typeof action.payload !== 'string') state.loading = {};
            else delete state.loading[action.payload as keyof typeof state.loading];
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
        },
        setTyping: (state, action: PayloadAction<{ type: 'typing_start' | 'typing_end', id: string }>) => {
            if (action.payload.type === 'typing_start') {
                state.typing.push(action.payload.id);
            } else if (action.payload.type === 'typing_end') {
                state.typing = state.typing.filter((t: string) => t !== action.payload.id);
            }
        }
    }
});

export const { setDevice, setUser, setLoading, stopLoading, setChatHistory, addChatMsg, setHref, setTyping } = miscSlice.actions;
export default miscSlice.reducer;