import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { privateKey, publicKey } from "../utils/keys";
import { TUserRole } from "../models/User";
import { IToken } from "../models/Token";
import { HelperController, IUserDoc } from "../helpers/Default";
import jwt_decode from "jwt-decode";
import { doc } from "firebase/firestore";
import { DBUsers, db } from "../utils/firebase";
import { config } from "dotenv";

config()

export function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // const VITE_OPS_COOKIE_NAME = process.env.VITE_OPS_COOKIE_NAME!
        // const auth = req.cookies[VITE_OPS_COOKIE_NAME]
        const token = req.headers.authorization?.split(' ')[1]
        if (token) {

            // const token = auth
            jwt.verify(token, publicKey, {
                algorithms: ["RS256"],
            }, async (err, decoded: string | jwt.JwtPayload | undefined | IToken) => {
                if (err) return res.sendStatus(401)
                const decode = decoded as IToken
                if (decode) {
                    const decodedToken = jwt_decode<IToken>(token)
                    decodedToken.UID = decode.UID;
                    decodedToken.tokenVersion = decode.tokenVersion;
                    //Check 5 min to create token
                    if (Date.now() / 1000 - decode.iat > 60 * 5 * 1000) {
                        const User = new HelperController()
                        const user = await User.getId(doc(db, DBUsers, decodedToken.UID)) as IUserDoc
                        if (user) {
                            //Check token version
                            if (user.tokenVersion === user.tokenVersion) {
                                user.tokenVersion = user.tokenVersion! + 1;
                                await User.update(decodedToken.UID, DBUsers, { tokenVersion: user.tokenVersion } as IUserDoc)
                                    .then(() => {
                                        const refreshToken = createToken(decodedToken.UID, user.tokenVersion!, decodedToken.role)
                                        return res
                                            .status(200)
                                            .send({ token: refreshToken })
                                    })
                                    .catch(() => {
                                        return res.sendStatus(403)
                                    })
                            }
                        }
                    } else {
                            next()
                    }
                    // next()
                }

            })

        } else {
            return res.sendStatus(401)
        }
    } catch (error) {
        return res.sendStatus(404)
    }
}

export const createToken = (UID: string, tokenVersion: number, role: TUserRole) => {
    return jwt.sign({ UID, tokenVersion, role }, privateKey, {
        algorithm: "RS256",
        expiresIn: "6h",
    });
};