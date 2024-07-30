import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IGame } from '@/utils/types';
import { SessionStage, SessionStatus } from '@/utils/enums';

const initialState: IGame = {
    "id": "111",
    "status": SessionStatus.LOBBY,
    "seats": [
        null, null, null, null
    ],
    "small_blind": 10,
    "big_blind": 20,
    "max_players": 4,
    "players": [],
    "stage": SessionStage.PREFLOP,
    "board": {
        "cards": [],
        "ranks": [],
        "suits": [],
        "rank_counts": {},
        "suit_counts": {}
    },
    "current_player": null,
    "dealer": null,
    "current_bet": null,
    "total_bet": null
};

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        setGameState: (state, action: PayloadAction<IGame>) => {
            const res = structuredClone(action.payload);
            res.seats = res.seats.map((s: string) => (s === 'None' ? null : s));
            Object.assign(state, res);
        }
    }
})

export const { setGameState } = gameSlice.actions;
export default gameSlice.reducer;