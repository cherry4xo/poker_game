import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import { IGame } from '@/utils/types';
import { SessionStage, SessionStatus } from '@/utils/enums';

const initialState: IGame = {
    "id": "",
    "status": SessionStatus.LOBBY,
    "seats": [null, null, null, null],
    "owner": "",
    "small_blind": 0,
    "big_blind": 0,
    "max_players": 0,
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

            // #winnerskostyl
            // remove at all, should be on backend
            if (!!res.winners) {
                res.seats = state.seats;
                res.status = 4;
            }

            res.seats = res.seats.map((s: string) => (s === 'None' ? null : s));
            Object.assign(state, res);
        }
    }
})

export const { setGameState } = gameSlice.actions;
export default gameSlice.reducer;