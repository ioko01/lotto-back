import { NextFunction, Request, Response } from 'express'
import { router } from "../server";
import { TUserRole } from "../models/User";
import { authorization } from "../middleware/authorization";
import { HelperController, IStoreDoc, IUserDoc } from "../helpers/Default";
import { DBStores, storesCollectionRef } from '../utils/firebase';
import { DocumentData, Query, documentId, query, where } from 'firebase/firestore';
import { GMT } from '../utils/time';
import { IStore } from '../models/Store';

const Helpers = new HelperController()

export class ApiStore {
    constructor() {

    }
    getStoreAllMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const { id } = req.params as { id: string }
                        const q = query(storesCollectionRef, where("user_create_id", "==", authorize.id), where(documentId(), "==", id))

                        const store = await Helpers.getContain(q)
                        if (store.length === 0) return res.status(400).json({ message: "don't have store" })
                        return res.json(store)
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

    getStoreMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        let q: Query<DocumentData> | undefined = undefined
                        if (authorize.role === "ADMIN") {
                            q = query(storesCollectionRef)
                        } else if (authorize.role === "AGENT") {
                            q = query(storesCollectionRef, where("user_create_id", "==", authorize.id))
                        } else if (authorize.role === "MANAGER" || authorize.role === "MANAGE_REWARD" || authorize.role === "MEMBER") {
                            q = query(storesCollectionRef, where(documentId(), "==", authorize.store_id))
                        }

                        if (!q) return res.sendStatus(403)

                        const store = await Helpers.getContain(q) as IStoreDoc[]
                        if (!store) return res.status(400).json({ message: "don't have store" })
                        return res.json(store)
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

    getStoreAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const store = await Helpers.getAll(storesCollectionRef)
                        if (!store) return res.status(400).json({ message: "don't have store" })
                        return res.json(store)
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

    addStore = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                let authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IStoreDoc
                        const q = query(storesCollectionRef, where("name", "==", data.name))
                        const isStore = await Helpers.getContain(q)
                        if (isStore.length > 0) return res.status(400).json({ message: "this store has been used" })
                        if (data.agent_create_id) authorize = data.agent_create_id

                        const store: IStore = {
                            img_logo: data.img_logo,
                            name: data.name,
                            created_at: GMT(),
                            updated_at: GMT(),
                            user_create_id: authorize as IUserDoc
                        }

                        await Helpers.add(storesCollectionRef, store)
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

    updateStore = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body
                        await Helpers.update("1", DBStores, data)
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

    deleteStore = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.delete(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as { id: string }
                        await Helpers.delete(data.id, DBStores)
                            .then((data) => {
                                if (data === 400) return res.status(400).json({ message: "don't have store" })
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
}
