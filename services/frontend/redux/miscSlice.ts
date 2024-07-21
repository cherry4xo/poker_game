import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from '@reduxjs/toolkit';

interface MiscState {
    device: string | null;
}

const initialState: MiscState = {
    device: null
};

export const miscSlice = createSlice({
    name: 'misc',
    initialState,
    reducers: {
        setDevice: (state, action: PayloadAction<string>) => {
            state.device = action.payload;
        }
    }
})

export const { setDevice } = miscSlice.actions;
export default miscSlice.reducer;