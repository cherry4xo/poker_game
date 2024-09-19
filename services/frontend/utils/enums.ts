export enum SessionStatus {
    LOBBY = 1,
    GAME = 2,
    PAUSED = 3
}

export enum SessionStage {
    PREFLOP = 0,
    FLOP = 1,
    TURN = 2,
    RIVER = 3,
    SHOWDOWN = 4
}

export enum PlayerStatus {
    NOT_READY = 0,
    READY = 1,
    PASS = 2,
    CHECK = 3,
    BET = 4,
    CALL = 5,
    RAISE = 6,
    ALL_IN = 7,
    WAITING = 8
}
