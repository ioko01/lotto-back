import { NextFunction, Request, Response } from 'express'
import { router } from "../server";
import { TUserRole } from "../models/User";
import { authorization } from "../middleware/authorization";
import { HelperController } from "../helpers/Default";
import { DBLottos, checkRewardsCollectionRef, db } from '../utils/firebase';
import { ICheckRewardDoc } from '../models/Id';
import { ICheckReward } from '../models/CheckReward';
import { doc, where, query, Timestamp } from 'firebase/firestore';
import { GMT, getTomorrow } from '../utils/time';

const Helpers = new HelperController()

export class ApiCheckReward {
    getCheckRewardAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const reward = await Helpers.getAll(checkRewardsCollectionRef) as ICheckRewardDoc[]
                        if (!reward) return res.status(202).json({ message: "don't have reward" })
                        return res.json(reward)
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (err: any) {
                // if (err.code === 11000) {
                //     return res.status(409).json({
                //         status: 'fail',
                //         message: 'username already exist',
                //     });
                // }
            }
        })
    }

    getCheckRewardAllWithDateStartEnd = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        let st = req.params.start.split("-")
                        let en = req.params.end.split("-")
                        if (parseInt(st[0]) < 10) st[0] = `0${st[0]}`
                        if (parseInt(en[0]) < 10) en[0] = `0${en[0]}`
                        if (parseInt(st[1]) < 10) st[1] = `0${st[1]}`
                        if (parseInt(en[1]) < 10) en[1] = `0${en[1]}`
                        const date_start = Timestamp.fromDate(new Date(`${st[2]}-${st[1]}-${st[0]}T00:00:00`))
                        const date_end = Timestamp.fromDate(new Date(`${en[2]}-${en[1]}-${en[0]}T23:59:59`))
                        
                        const q = query(checkRewardsCollectionRef, where("created_at", ">", date_start), where("created_at", "<=", date_end))
                        const reward = await Helpers.getContain(q) as ICheckRewardDoc[]
                        if (!reward) return res.status(202).json({ message: "don't have reward" })
                        return res.json(reward)
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (err: any) {
                // if (err.code === 11000) {
                //     return res.status(409).json({
                //         status: 'fail',
                //         message: 'username already exist',
                //     });
                // }
            }
        })
    }

    getCheckRewardId = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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
                // if (err.code === 11000) {
                //     return res.status(409).json({
                //         status: 'fail',
                //         message: 'username already exist',
                //     });
                // }
            }
        })
    }

    getCheckRewardMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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
                // if (err.code === 11000) {
                //     return res.status(409).json({
                //         status: 'fail',
                //         message: 'username already exist',
                //     });
                // }
            }
        })
    }

    getCheckRewardStore = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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
                // if (err.code === 11000) {
                //     return res.status(409).json({
                //         status: 'fail',
                //         message: 'username already exist',
                //     });
                // }
            }
        })
    }

    addCheckReward = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        let admin_create_id;
                        if (authorize.role === "AGENT") {
                            admin_create_id = authorize.admin_create_id
                        } else if (authorize.role === "ADMIN") {
                            admin_create_id = authorize
                        }

                        const data = req.body as ICheckReward
                        const lotto = await Helpers.getId(doc(db, DBLottos, data.lotto_id.id))
                        if (!lotto) return res.status(202).json({ message: "don't have lotto" })
                        const q = query(checkRewardsCollectionRef, where("lotto_id", "==", data.lotto_id))
                        const checkReward = await Helpers.getContain(q)
                        if (checkReward.length > 0) return res.status(202).json({ message: "this reward has been used" })

                        const date = new Date();
                        let day = date.getDate().toString();
                        let month = (date.getMonth() + 1).toString();
                        let hour = date.getHours().toString();
                        let minute = date.getMinutes().toString();
                        if (parseInt(month) < 10) {
                            month = `0${month}`;
                        }
                        if (parseInt(day) < 10) {
                            day = `0${day}`;
                        }

                        if (getTomorrow(data.lotto_id.open, `${hour}:${minute}`)) {
                            date.setDate(date.getDate() - 1).toString()
                            day = date.getDate().toString()
                        }

                        if (data.top.length != 3) return res.status(202).json({ message: "invalid top digits" })
                        if (data.bottom.length != 2) return res.status(202).json({ message: "invalid bottom digits" })
                        
                        const reward: ICheckReward = {
                            lotto_id: data.lotto_id,
                            top: data.top,
                            bottom: data.bottom,
                            times: Timestamp.fromDate(new Date(`${date.getFullYear()}-${month}-${day}T00:00:00`)),
                            user_create_id: authorize,
                            admin_create_id: admin_create_id,
                            created_at: GMT(),
                            updated_at: GMT(),
                        }

                        await Helpers.add(checkRewardsCollectionRef, reward)
                            .then(() => {
                                return res.send({ statusCode: res.statusCode, message: "OK" })
                            })
                            .catch(error => {
                                return res.send({ statusCode: res.statusCode, message: error })
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

    updateCheckReward = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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

    deleteCheckReward = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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
