export interface IPlayer {
    pos: any;
    id: string;
    balance: number;
    bet: number;
    passed: boolean;
}

export interface IGame {
    players: IPlayer[];
    dealer: number | null;
    current_player: number;
    status: 'starting' | 'playing';
    bank: number;

    // params
    small_blind: number;
    big_blind: number;
}
