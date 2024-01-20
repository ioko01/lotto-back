import { Request } from "express";
import jwt_decode from "jwt-decode";
import { IToken } from "../models/Token";
import { TUserRole } from "../models/User";
import { HelperController, IUserDoc } from "../helpers/Default";
import { doc } from "firebase/firestore";
import { DBUsers, db } from "../utils/firebase";

export async function authorization(req: Request, roles: TUserRole[]) {
    try {
        // const VITE_OPS_COOKIE_NAME = process.env.VITE_OPS_COOKIE_NAME!
        // const auth = req.cookies[VITE_OPS_COOKIE_NAME]
        const token = req.headers.authorization?.split(' ')[1]

        if (token) {
            // const token = auth
            const decodedToken = jwt_decode<IToken>(token)
            const Helpers = new HelperController()
            const user = await Helpers.getId(doc(db, DBUsers, decodedToken.UID)) as IUserDoc
            if (decodedToken.tokenVersion === user.tokenVersion) {
                const isUser: IUserDoc = {
                    credit: user.credit,
                    fullname: user.fullname,
                    id: decodedToken.UID,
                    role: user.role,
                    status: user.status,
                    username: user.username,
                }
                if (user.admin_create_id) isUser.admin_create_id = user.admin_create_id
                if (user.agent_create_id) isUser.agent_create_id = user.agent_create_id
                if (user.manager_create_id) isUser.manager_create_id = user.manager_create_id
                if (user.user_create_id) isUser.user_create_id = user.user_create_id
                if (user.store_id) isUser.store_id = user.store_id

                if (roles.includes(decodedToken.role)) return isUser
                return 401
            }
            return 401
        }
        return 401
    } catch (error) {
        return 401
    }
}