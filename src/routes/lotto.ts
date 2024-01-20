import { NextFunction, Request, Response } from 'express'
import { router } from "../server";
import { TUserRole } from "../models/User";
import { authorization } from "../middleware/authorization";
import { DBBills, DBLottos, db, lottosCollectionRef } from "../utils/firebase";
import { doc, query, where } from "firebase/firestore";
import { GMT } from "../utils/time";
import { HelperController, ILottoDoc } from "../helpers/Default";
import { ILotto, TLottoStatusEnum } from "../models/Lotto";

const Helpers = new HelperController()


export class ApiLotto {

    getLottoId = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.params as { id: string }
                        const lotto = await Helpers.getId(doc(db, DBLottos, data.id))
                        if (!lotto) return res.status(400).json({ message: "don't have lotto" })
                        return res.json(lotto)
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

    getLottoMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(lottosCollectionRef, where("user_create_id", "==", authorize.id))
                        const lotto = await Helpers.getContain(q) as ILottoDoc[]
                        if (!lotto) return res.status(400).json({ message: "don't have lotto" })
                        return res.json(lotto)
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

    getLottoAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const lotto = await Helpers.getAll(lottosCollectionRef) as ILottoDoc[]
                        if (!lotto) return res.status(400).json({ message: "don't have lotto" })
                        return res.json(lotto)
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

    addLotto = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as ILotto
                        const lotto: ILotto = {
                            name: data.name,
                            img_flag: data.img_flag,
                            open: data.open,
                            close: data.close,
                            report: data.report,
                            status: data.status,
                            created_at: GMT(),
                            updated_at: GMT(),
                            user_create_id: authorize,
                            date_type: data.date_type,
                            date: data.date
                        }
                        if (data.date) lotto.date = data.date
                        if (data.thai_open_date) lotto.thai_open_date = data.thai_open_date


                        await Helpers.add(lottosCollectionRef, lotto)
                            .then(() => {
                                return res.send({ statusCode: res.statusCode, message: "OK" })
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "add lotto unsuccessfully" })
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

    updateLotto = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {

            } catch (error) {
                res.status(res.statusCode).send(error);
            }

        })
    }

    statusLotto = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as ILottoDoc
                        await Helpers.update(data.id, DBLottos, { status: data.status } as ILotto)
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

    deleteLotto = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.delete(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as { id: string }
                        await Helpers.delete(data.id, DBLottos)
                            .then((data) => {
                                if (data === 400) return res.status(400).json({ message: "don't have lotto" })
                                return res.send({ statusCode: res.statusCode, message: "OK" })
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "delete lotto unsuccessfully" })
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
}
