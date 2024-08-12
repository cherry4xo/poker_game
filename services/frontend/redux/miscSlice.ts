import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IUser } from '@/utils/types';

interface MiscState {
    device: string | null;
    user: IUser | null;
    loading: any;
}

const initialState: MiscState = {
    device: null,
    user: null,
    loading: {}
};

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
        }
    }
});

export const { setDevice, setUser, setLoading } = miscSlice.actions;
export default miscSlice.reducer;