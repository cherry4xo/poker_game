import { configureStore } from '@reduxjs/toolkit';
import miscReducer from '@/redux/miscSlice';
import gameReducer from '@/redux/gameSlice';

export const store = configureStore({
    reducer: {
        misc: miscReducer,
        game: gameReducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;