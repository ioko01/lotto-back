import { IBillDoc } from "../helpers/Bill";
import { NextFunction, Request, Response } from 'express'
import { router } from "../server";
import { TUserRole } from "../models/User";
import { authorization } from "../middleware/authorization";
import { DBBills, DBLottos, DBRates, DBStores, DBUsers, billsCollectionRef, db, storesCollectionRef } from "../utils/firebase";
import { DocumentData, Query, doc, documentId, query, where } from "firebase/firestore";
import { IBill } from "../models/Bill";
import { GMT } from "../utils/time";
import { HelperController, ILottoDoc, IRateDoc, IStoreDoc } from "../helpers/Default";

const Helpers = new HelperController()

export class ApiBill {

    getBillAllMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const { id } = req.params as { id: string }
                        let q: Query<DocumentData> | undefined = undefined
                        if (authorize.role === "ADMIN") {
                            q = query(billsCollectionRef, where(documentId(), "==", id))
                        } else if (authorize.role === "AGENT") {
                            q = query(billsCollectionRef, where("agent_create_id", "==", authorize.id))
                        } else if (authorize.role === "MANAGER") {
                            q = query(billsCollectionRef, where("agent_create_id", "==", authorize.agent_create_id), where("manager_create_id", "==", authorize.id))
                        }

                        if (!q) return res.sendStatus(403)

                        const bill = await Helpers.getContain(q)
                        if (bill.length === 0) return res.status(400).json({ message: "don't have bill" })
                        return res.json(bill)
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

    getBillMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(billsCollectionRef, where("user_create_id", "==", authorize.id))
                        const bill = await Helpers.getContain(q) as IBillDoc[]
                        if (!bill) return res.status(400).json({ message: "don't have bill" })
                        return res.json(bill)
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

    getBillAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const bill = await Helpers.getAll(billsCollectionRef) as IBillDoc[]
                        if (!bill) return res.status(400).json({ message: "don't have bill" })
                        return res.json(bill)
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

    calculatePrice = (one_digits: string[], two_digits: string[], three_digits: string[]) => {
        let one_price_array: number[] = []
        let total: number[] = []
        one_digits?.map(digit => {
            const top = digit.split(":")[1]
            const bottom = digit.split(":")[2]
            one_price_array.push(parseInt(top))
            one_price_array.push(parseInt(bottom))
        })
        total.push(one_price_array.reduce((price, current) => price + current, 0))

        let two_price_array: number[] = []
        two_digits?.map(digit => {
            const top = digit.split(":")[1]
            const bottom = digit.split(":")[2]
            two_price_array.push(parseInt(top))
            two_price_array.push(parseInt(bottom))
        })
        total.push(two_price_array.reduce((price, current) => price + current, 0))

        let three_price_array: number[] = []
        three_digits?.map(digit => {
            const top = digit.split(":")[1]
            const bottom = digit.split(":")[2]
            three_price_array.push(parseInt(top))
            three_price_array.push(parseInt(bottom))
        })
        total.push(three_price_array.reduce((price, current) => price + current, 0))

        const price = total.reduce((price, current) => price + current, 0)
        return price
    }

    addBill = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IBill
                        if (!data.lotto_id && !data.rate_id && !data.times) return res.sendStatus(403)
                        const rate = await Helpers.getId(doc(db, DBRates, data.rate_id.id)) as IRateDoc
                        const lotto = await Helpers.getId(doc(db, DBLottos, data.lotto_id.id)) as ILottoDoc
                        const store = await Helpers.getId(doc(db, DBStores, data.store_id.id)) as IStoreDoc

                        if (!rate) return res.status(400).json({ message: "don't have rate" })
                        if (!lotto) return res.status(400).json({ message: "don't have lotto" })
                        if (!store) return res.status(400).json({ message: "don't have store" })

                        if (rate.lotto_id !== data.lotto_id) return res.status(400).json({ message: "don't have rate in store" })
                        const bill: IBill = {
                            lotto_id: data.lotto_id,
                            note: data.note,
                            rate_id: data.rate_id,
                            status: "WAIT",
                            store_id: data.store_id,
                            times: data.times,
                            one_digits: data.one_digits,
                            two_digits: data.two_digits,
                            three_digits: data.three_digits,
                            reward: data.reward,
                            created_at: GMT(),
                            updated_at: GMT(),
                            user_create_id: authorize
                        }

                        const price = this.calculatePrice(data.one_digits!, data.two_digits!, data.three_digits!)

                        await Helpers.add(billsCollectionRef, bill)
                            .then(async () => {
                                if (authorize.credit < price) return res.status(400).json({ message: "no credit" })
                                await Helpers.update(authorize.id, DBUsers, { credit: authorize.credit - price })
                                    .then(() => {
                                        res.send({ statusCode: res.statusCode, message: "OK" })
                                    })
                                    .catch(() => {
                                        return res.status(400).json({ message: "update credit unsuccessfully" })
                                    })
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "add bill unsuccessfully" })
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

    // updateBill = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
    //     router.put(url, middleware, async (req: Request, res: Response) => {
    //         try {
    //             const data = req.body
    //             await Helpers.update("1", DBBills, data)
    //                 .then(() => {
    //                     res.send({ statusCode: res.statusCode, message: "OK" })
    //                 })
    //                 .catch(error => {
    //                     res.send({ statusCode: res.statusCode, message: error })
    //                 })
    //         } catch (error) {
    //             res.status(res.statusCode).send(error);
    //         }

    //     })
    // }

    deleteBill = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as { id: string }
                        const q = query(billsCollectionRef, where("user_create_id", "==", authorize.id), where(documentId(), "==", data.id))
                        const isBillMe = await Helpers.getContain(q) as IBillDoc[]
                        if (isBillMe.length <= 0) return res.sendStatus(403)

                        const [price] = isBillMe.map(bill => {
                            if (bill.status === "CANCEL" || bill.status === "REWARD") return false
                            const price = this.calculatePrice(bill.one_digits!, bill.two_digits!, bill.three_digits!)
                            return price
                        })

                        if (!price) return res.status(400).json({ message: "can not delete bill" })
                        await Helpers.update(data.id, DBBills, { status: "CANCEL" })
                            .then(async () => {
                                await Helpers.update(authorize.id, DBUsers, { credit: authorize.credit + price })
                                    .then(() => {
                                        res.send({ statusCode: res.statusCode, message: "OK" })
                                    })
                                    .catch(() => {
                                        return res.status(400).json({ message: "update credit unsuccessfully" })
                                    })
                            })
                            .catch(error => {
                                return res.status(400).json({ message: "delete bill unsuccessfully" })
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
