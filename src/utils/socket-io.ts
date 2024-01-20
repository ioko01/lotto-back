
export interface ServerToClientEvents {
    noArg: () => void;
    get_digit_close: () => void;
    get_user: () => void;
    get_store: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
}

export interface ClientToServerEvents {
    create_digit_close: () => void;
    create_user: () => void;
    create_store: () => void;
}

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    age: number;
}