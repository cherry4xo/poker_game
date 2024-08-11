import { PlayerStatus, SessionStage, SessionStatus } from '@/utils/enums';

export interface IGame {
    id: string;
    status: SessionStatus;
    seats: any[];
    small_blind: number;
    big_blind: number;
    max_players: number;
    players: IPlayer[];
    stage: SessionStage;
    board: {
        cards: any[],
        ranks: any[],
        suits: any[],
        rank_counts: any,
        suit_counts: any
    };
    current_player: null;
    dealer: null;
    current_bet: null;
    total_bet: null;
}

export interface IPlayer {
    id: string;
    name: string;
    balance: number;
    hand: {
        cards: any[],
        ranks: any[],
        suits: any[],
        rank_counts: any,
        suit_counts: any
    };
    currentbet: number;
    status: PlayerStatus;
}

// export interface IUser {
//     uuid: string;
//     username: string;
//     registration_date: string;
//     is_admin: boolean;
//     is_confirmed: boolean;
//     email: string;
// }

export interface ISignup {
    username: string;
    email: string;
    password: string;
}
