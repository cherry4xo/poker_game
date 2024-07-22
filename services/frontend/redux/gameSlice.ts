import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from '@reduxjs/toolkit';
import { IGame, IPlayer } from '@/utils/types';
import { makeid, positions, randomorg } from '@/utils/misc';

const initialState: IGame = {
    players: Array(positions.length),
    current_player: 0,
    dealer: null,
    status: 'starting',
    bank: 0,

    small_blind: 10,
    big_blind: 20
};

const initPlayer = {
    balance: 1000,
    bet: 0,
    passed: false
};

const nextPlayerIndex = (state: IGame, index?: number) => {
    const i = index ?? state.current_player;
    // const players = Array
    //     .from({ length: state.players.length }, (_: any, i: number) => i)
    //     .filter((p: number) => !state.players[p].passed);

    return i + 1 > state.players.length - 1 ? 0 : i + 1;
}

export const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        addPlayer: (state, action: PayloadAction<number>) => {
            state.players[action.payload] = { ...initPlayer, pos: positions[action.payload], id: makeid(5) };
        },
        startGame: (state) => {
            state.status = 'playing';
            state.players = state.players.filter(p => p);

            state.dealer = randomorg(0, state.players.length - 1);

            state.players[state.dealer].bet = state.small_blind;
            state.players[state.dealer].balance -= state.small_blind;

            state.players[nextPlayerIndex(state, state.dealer)].bet = state.big_blind;
            state.players[nextPlayerIndex(state, state.dealer)].balance -= state.big_blind;

            state.current_player = nextPlayerIndex(state, nextPlayerIndex(state, state.dealer));
        },
        bet: (state, action: PayloadAction<number>) => {
            state.players[state.current_player].bet += action.payload;
            state.players[state.current_player].balance -= action.payload;

            state.current_player = nextPlayerIndex(state);
        },
        pass: (state) => {
            state.bank += state.players[state.current_player].bet;
            state.players[state.current_player].bet = 0;
            state.players[state.current_player].passed = true;
            state.current_player = nextPlayerIndex(state);
        }
    }
})

export const { addPlayer } = gameSlice.actions;
export default gameSlice.reducer;