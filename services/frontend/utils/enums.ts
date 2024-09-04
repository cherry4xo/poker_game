export enum SessionStatus {
    LOBBY = 1,
    GAME = 2,
    PAUSED = 3,
    END = 4
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
    PLAYING = 2,
    STAYING = 3,
    PASS = 4
}
