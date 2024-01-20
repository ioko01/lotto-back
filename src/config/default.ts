import { CorsOptions } from "cors";
import { config } from "dotenv";
import { ServerOptions } from "socket.io";
config()

export const PORT: string | number = process.env.PORT || 8888
export const corsOption: CorsOptions = {
    origin: true,
    credentials: true,
}

export const socketServerOption: Partial<ServerOptions> = {
    cors: {
        origin: true
    },
}