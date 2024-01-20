import { NextFunction, Request, Response } from 'express'
import { router } from "../server";
import { TUserRole } from "../models/User";
import { authorization } from "../middleware/authorization";
import { HelperController } from "../helpers/Default";
import { DBDigitsClose, db, digitsCloseCollectionRef } from '../utils/firebase';
import { doc, query, where } from 'firebase/firestore';
import { IDigitCloseDoc } from '../helpers/Default';
import { IDigitClose } from '../models/DigitClose';
import { GMT } from '../utils/time';

const Helpers = new HelperController()

export class ApiDigitClose {
    getDigitCloseId = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.params as { id: string }
                        const q = query(digitsCloseCollectionRef, where("lotto_id", "==", data.id))
                        const [digitClose] = await Helpers.getContain(q) as IDigitCloseDoc[]
                        if (!digitClose) return res.status(400).json({ message: "don't have digit close" })
                        return res.json(digitClose)
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }

            } catch (err: any) {
                if (err.code === 11000) {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'username already exist',
                    });
                }
            }
        })
    }

    getDigitCloseMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(digitsCloseCollectionRef, where("user_create_id", "==", authorize.id))
                        const digitClose = await Helpers.getContain(q) as IDigitCloseDoc[]
                        if (!digitClose) return res.status(400).json({ message: "don't have digit close" })
                        return res.json(digitClose)
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (err: any) {
                if (err.code === 11000) {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'username already exist',
                    });
                }
            }
        })
    }

    getDigitCloseAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {

                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (err: any) {
                if (err.code === 11000) {
                    return res.status(409).json({
                        status: 'fail',
                        message: 'username already exist',
                    });
                }
            }
        })
    }

    addDigitClose = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IDigitCloseDoc
                        const q = query(digitsCloseCollectionRef, where("lotto_id", "==", data.lotto_id), where("rate_id", "==", data.rate_id), where("store_id", "==", data.store_id))
                        const isStore = await Helpers.getContain(q)
                        if (isStore.length > 0) return res.status(400).json({ message: "this digit close has been used" })

                        const digitClose: IDigitClose = {
                            lotto_id: data.lotto_id,
                            percent: data.percent,
                            rate_id: data.rate_id,
                            store_id: data.store_id,
                            one_digits: data.one_digits,
                            two_digits: data.two_digits,
                            three_digits: data.three_digits,
                            user_create_id: authorize,
                            created_at: GMT(),
                            updated_at: GMT(),
                        }

                        await Helpers.add(digitsCloseCollectionRef, digitClose)
                            .then(() => {
                                res.send({ statusCode: res.statusCode, message: "OK" })
                            })
                            .catch(error => {
                                res.send({ statusCode: res.statusCode, message: error })
                            })
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (error) {
                res.status(res.statusCode).send(error);
            }
        })
    }

    updateDigitClose = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {

                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (error) {
                res.status(res.statusCode).send(error);
            }

        })
    }

    deleteDigitClose = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.delete(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {

                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }

            } catch (error) {
                res.status(res.statusCode).send(error);
            }
        })
    }
}
