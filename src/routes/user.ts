import { NextFunction, Request, Response } from 'express';
import { router } from "../server";
import { DocumentData, Query, doc, documentId, getDocs, query, where } from 'firebase/firestore';
import { validatePassword, validateUsername } from '../utils/validate';
import { IUser, TUserRole, TUserRoleEnum, TUserStatusEnum } from '../models/User';
import { DBStores, DBUsers, db, usersCollectionRef } from '../utils/firebase';
import bcrypt from "bcrypt";
import { GMT } from '../utils/time';
import { createToken } from '../middleware/authenticate';
import { config } from "dotenv";
import { HelperController, IStoreDoc, IUserDoc } from '../helpers/Default';
import { authorization } from '../middleware/authorization';

config()

const Helpers = new HelperController()

export class ApiUser {

    getMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const isMe = await Helpers.getId(doc(db, DBUsers, authorize.id)) as IUserDoc
                        if (!isMe) return res.status(400).json({ message: "don't have user" })
                        // return res.json(isMe)
                        const data: IUserDoc = {
                            credit: isMe.credit,
                            fullname: isMe.fullname,
                            role: isMe.role,
                            created_at: isMe.created_at,
                            status: isMe.status,
                            username: isMe.username,
                            id: isMe.id,
                        }
                        return res.json(data)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    getUsername = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                const data = req.body as { username: string }
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(usersCollectionRef, where("username", "==", data.username))
                        const isId = await Helpers.getContain(q)
                        if (!isId) return res.status(400).json({ message: "don't have user" })
                        // return res.json(isId)
                        return res.json(isId)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    getId = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                const data = req.body as { user_create_id: string }
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(usersCollectionRef, where("user_create_id", "==", data.user_create_id))
                        const isId = await Helpers.getContain(q)
                        if (!isId) return res.status(400).json({ message: "don't have user" })
                        // return res.json(isId)
                        return res.json(isId)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    getUserAllMe = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        let q: Query<DocumentData> | undefined = undefined
                        if (authorize.role === "ADMIN") {
                            q = query(usersCollectionRef)
                        } else if (authorize.role === "AGENT") {
                            q = query(usersCollectionRef, where("agent_create_id", "==", authorize.id))
                        } else if (authorize.role === "MANAGER") {
                            q = query(usersCollectionRef, where("agent_create_id", "==", authorize.agent_create_id), where("manager_create_id", "==", authorize.id))
                        }

                        if (!q) return res.sendStatus(403)

                        const isUserMe = await Helpers.getContain(q)
                        if (isUserMe.length === 0) return res.status(400).json({ message: "don't have user" })
                        return res.json(isUserMe)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    getUserAll = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const user = await Helpers.getAll(usersCollectionRef) as IUserDoc[]
                        if (!user) return res.status(400).json({ message: "don't have user" })
                        return res.json(user)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    getUserAllIsRole = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                const role = req.params.role
                if (authorize) {
                    if (authorize !== 401) {
                        const q = query(usersCollectionRef, where("role", "==", role))
                        const user = await Helpers.getContain(q)
                        if (!user) return res.status(400).json({ message: "don't have user" })
                        return res.json(user)
                    } else {
                        return res.sendStatus(authorize)
                    }
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    credit = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUserDoc
                        const user = await Helpers.getId(doc(db, DBUsers, data.id)) as IUserDoc
                        if (req.params.excute === "remove" && user.credit - data.credit < 0) return res.sendStatus(403)
                        let creditMe = 0;
                        let credit = 0;
                        if (req.params.excute === "add") {
                            if (authorize.role === "ADMIN" || authorize.role === "AGENT") {
                                credit = user.credit + data.credit
                            } else if (authorize.role === "MANAGER") {
                                if (authorize.credit - data.credit >= 0) {
                                    creditMe = authorize.credit - data.credit
                                    credit = user.credit + data.credit
                                } else {
                                    return res.sendStatus(403)
                                }
                            } else {
                                return res.sendStatus(403)
                            }
                        }
                        if (req.params.excute === "remove") {
                            if (authorize.role === "ADMIN" || authorize.role === "AGENT") {
                                credit = user.credit - data.credit
                            } else if (authorize.role === "MANAGER") {
                                creditMe = authorize.credit + data.credit
                                credit = user.credit - data.credit
                            }
                        }
                        let q: Query<DocumentData> | undefined = undefined

                        if (authorize.role === "ADMIN") {
                            q = query(usersCollectionRef, where("1", "==", "1"))
                        } else if (authorize.role === "AGENT") {
                            q = query(usersCollectionRef, where("agent_create_id", "==", authorize.id))
                        } else if (authorize.role === "MANAGER") {
                            q = query(usersCollectionRef, where("agent_create_id", "==", authorize.agent_create_id), where("manager_create_id", "==", authorize.id))
                        }

                        if (!q) return res.sendStatus(400)

                        const isUserMe = await Helpers.getContain(q)
                        if (isUserMe.length > 0) {
                            if (authorize.role === "ADMIN" || authorize.role === "AGENT") {
                                await Helpers.update(data.id, DBUsers, { credit } as IUser)
                                    .then(() => {
                                        return res.send({ statusCode: res.statusCode, message: "OK" })
                                    })
                                    .catch(error => {
                                        return res.send({ statusCode: res.statusCode, message: error })
                                    })
                            } else if (authorize.role === "MANAGER") {
                                await Helpers.update(authorize.id, DBUsers, { credit: creditMe } as IUser)
                                    .then(async () => {
                                        await Helpers.update(data.id, DBUsers, { credit } as IUser)
                                            .then(() => {
                                                return res.send({ statusCode: res.statusCode, message: "OK" })
                                            })
                                            .catch(error => {
                                                return res.send({ statusCode: res.statusCode, message: error })
                                            })
                                    })
                                    .catch(error => {
                                        return res.send({ statusCode: res.statusCode, message: error })
                                    })


                            }
                        }
                        return res.sendStatus(403)

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

    updateStatus = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.put(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUserDoc
                        await Helpers.update(data.id, DBUsers, { status: data.status } as IUser)
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

    statusAgent = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        this.updateStatus(url, middleware, roles)
    }

    statusManager = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        this.updateStatus(url, middleware, roles)
    }

    statusMember = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        this.updateStatus(url, middleware, roles)
    }

    addUserAdmin = (url: string) => {
        router.post(url, async (req: Request, res: Response) => {
            try {
                const q = query(usersCollectionRef, where("role", "==", TUserRoleEnum.ADMIN))
                const isAdmin = await getDocs(q)
                if (isAdmin.docs.length > 0) return res.sendStatus(401)

                const data = req.body as IUser
                const isValidateUsername = validateUsername(data.username);
                if (!isValidateUsername) throw new Error("username invalid");

                const isValidatePassword = validatePassword(data.password!);
                if (!isValidatePassword) throw new Error("password invalid");

                const q2 = query(usersCollectionRef, where("username", "==", data.username))
                const { docs } = await getDocs(q2)

                if (docs.length > 0) res.sendStatus(400).send({ message: "this username has been used" })

                const hashedPassword = await bcrypt.hash(data.password!, 10);

                const user: IUser = {
                    username: data.username,
                    password: hashedPassword,
                    fullname: data.fullname,
                    credit: data.credit,
                    role: TUserRoleEnum.ADMIN,
                    status: TUserStatusEnum.REGULAR,
                    created_at: GMT(),
                    updated_at: GMT(),
                    tokenVersion: 1
                }

                await Helpers.create(usersCollectionRef, user)
                    .then(async () => {
                        return res.sendStatus(200)
                    })
                    .catch(error => {
                        return res.send({ statusCode: res.statusCode, message: error })
                    })

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

    addUserAgent = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUser
                        const isValidateUsername = validateUsername(data.username);
                        if (!isValidateUsername) throw new Error("username invalid");

                        const isValidatePassword = validatePassword(data.password!!);
                        if (!isValidatePassword) throw new Error("password invalid");

                        const q = query(usersCollectionRef, where("username", "==", data.username))
                        const { docs } = await getDocs(q)

                        if (docs.length > 0) res.sendStatus(400).send({ message: "this username has been used" })

                        const hashedPassword = await bcrypt.hash(data.password!!, 10);

                        const user: IUser = {
                            username: data.username,
                            password: hashedPassword,
                            fullname: data.fullname,
                            credit: 0,
                            role: TUserRoleEnum.AGENT,
                            status: TUserStatusEnum.REGULAR,
                            created_at: GMT(),
                            updated_at: GMT(),
                            tokenVersion: 1,
                            admin_create_id: authorize
                        }

                        await Helpers.create(usersCollectionRef, user)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(error => {
                                return res.send({ statusCode: res.statusCode, message: error })
                            })

                    } else {
                        return res.sendStatus(authorize)
                    }
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

    addUserManager = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUser
                        const isValidateUsername = validateUsername(data.username);
                        if (!isValidateUsername) return res.sendStatus(400).send({ message: "username invalid" })

                        const isValidatePassword = validatePassword(data.password!);
                        if (!isValidatePassword) return res.sendStatus(400).send({ message: "password invalid" })

                        const q = query(usersCollectionRef, where("username", "==", data.username))
                        const { docs } = await getDocs(q)

                        if (docs.length > 0) return res.sendStatus(400).send({ message: "this username has been used" })

                        const hashedPassword = await bcrypt.hash(data.password!, 10);

                        if (!data.store_id) return res.status(400).json({ message: "please input store" })
                        const isStore = await Helpers.getId(doc(db, DBStores, data.store_id.id)) as IStoreDoc

                        if (!isStore) return res.status(400).json({ message: "don't have store" })
                        const user: IUser = {
                            store_id: data.store_id,
                            username: data.username,
                            password: hashedPassword,
                            fullname: data.fullname,
                            credit: 0,
                            role: TUserRoleEnum.MANAGER,
                            status: TUserStatusEnum.REGULAR,
                            created_at: GMT(),
                            updated_at: GMT(),
                            tokenVersion: 1
                        }

                        if (authorize.role === TUserRoleEnum.ADMIN) {
                            user.admin_create_id = data.agent_create_id!.admin_create_id
                            user.agent_create_id = data.agent_create_id
                        }
                        if (authorize.role === TUserRoleEnum.AGENT) {
                            user.admin_create_id = authorize.admin_create_id
                            user.agent_create_id = authorize
                        }

                        await Helpers.create(usersCollectionRef, user)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(error => {
                                return res.send({ statusCode: res.statusCode, message: error })
                            })
                    } else {
                        return res.sendStatus(authorize)
                    }
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

    addUserMember = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUser
                        const isValidateUsername = validateUsername(data.username);
                        if (!isValidateUsername) throw new Error("username invalid");

                        const isValidatePassword = validatePassword(data.password!);
                        if (!isValidatePassword) throw new Error("password invalid");

                        const q = query(usersCollectionRef, where("username", "==", data.username))
                        const { docs } = await getDocs(q)

                        if (docs.length > 0) res.sendStatus(400).send({ message: "this username has been used" })

                        const hashedPassword = await bcrypt.hash(data.password!, 10);

                        if (!data.store_id) return res.sendStatus(403)
                        const isStore = await Helpers.getId(doc(db, DBStores, data.store_id.id)) as IStoreDoc

                        if (!isStore) return res.sendStatus(403)

                        let user: IUser | {} = {}
                        if (authorize.role === TUserRoleEnum.ADMIN) {
                            user = {
                                store_id: data.store_id,
                                username: data.username,
                                password: hashedPassword,
                                fullname: data.fullname,
                                credit: 0,
                                role: TUserRoleEnum.MEMBER,
                                status: TUserStatusEnum.REGULAR,
                                created_at: GMT(),
                                updated_at: GMT(),
                                tokenVersion: 1,
                                admin_create_id: authorize,
                                agent_create_id: data.agent_create_id
                            }
                        } else if (authorize.role === TUserRoleEnum.AGENT) {
                            user = {
                                store_id: data.store_id,
                                username: data.username,
                                password: hashedPassword,
                                fullname: data.fullname,
                                credit: 0,
                                role: TUserRoleEnum.MEMBER,
                                status: TUserStatusEnum.REGULAR,
                                created_at: GMT(),
                                updated_at: GMT(),
                                tokenVersion: 1,
                                admin_create_id: authorize.admin_create_id,
                                agent_create_id: authorize.id
                            }
                        } else if (authorize.role === TUserRoleEnum.MANAGER) {
                            user = {
                                store_id: data.store_id,
                                username: data.username,
                                password: hashedPassword,
                                fullname: data.fullname,
                                credit: 0,
                                role: TUserRoleEnum.MEMBER,
                                status: TUserStatusEnum.REGULAR,
                                created_at: GMT(),
                                updated_at: GMT(),
                                tokenVersion: 1,
                                admin_create_id: authorize.admin_create_id,
                                agent_create_id: authorize.agent_create_id,
                                manager_create_id: authorize.id
                            }
                        }

                        await Helpers.create(usersCollectionRef, user as IUser)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(error => {
                                return res.send({ statusCode: res.statusCode, message: error })
                            })

                    } else {
                        return res.sendStatus(authorize)
                    }
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

    deleteUserAgent = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUserDoc
                        const q = query(usersCollectionRef, where("admin_create_id", "==", authorize.id), where(documentId(), "==", data.id))
                        const isUserMe = await Helpers.getContain(q)
                        if (!isUserMe) return res.status(400).json({ message: "don't have user" })

                        const closedUser = { status: "CLOSED" } as IUser

                        await Helpers.update(data.id, DBUsers, closedUser)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "delete agent unsuccessfully" })
                            })

                    } else {
                        return res.sendStatus(authorize)
                    }
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

    deleteUserManager = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUserDoc
                        const q = query(usersCollectionRef, where("agent_create_id", "==", authorize.id), where(documentId(), "==", data.id))
                        const isUserMe = await Helpers.getContain(q)
                        if (!isUserMe) return res.sendStatus(403)

                        const closedUser = { status: "CLOSED" } as IUser

                        await Helpers.update(data.id, DBUsers, closedUser)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "delete manager unsuccessfully" })
                            })
                    } else {
                        return res.sendStatus(authorize)
                    }
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

    deleteUserMember = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const data = req.body as IUserDoc
                        if (authorize.role === "ADMIN") {
                            const q = query(usersCollectionRef, where(documentId(), "==", data.id))
                            const isUserMe = await Helpers.getContain(q)
                            if (!isUserMe) return res.sendStatus(403)
                        } else if (authorize.role === "AGENT") {
                            const q = query(usersCollectionRef, where("agent_create_id", "==", authorize.id), where(documentId(), "==", data.id))
                            const isUserMe = await Helpers.getContain(q)
                            if (!isUserMe) return res.sendStatus(403)
                        } else if (authorize.role === "MANAGER") {
                            const q = query(usersCollectionRef, where("agent_create_id", "==", authorize.agent_create_id), where("manager_create_id", "==", authorize.id), where(documentId(), "==", data.id))
                            const isUserMe = await Helpers.getContain(q)
                            if (!isUserMe) return res.sendStatus(403)
                        }
                        const closedUser = { status: "CLOSED" } as IUser

                        await Helpers.update(data.id, DBUsers, closedUser)
                            .then(async () => {
                                return res.sendStatus(200)
                            })
                            .catch(() => {
                                return res.status(400).json({ message: "delete member unsuccessfully" })
                            })

                    } else {
                        return res.sendStatus(authorize)
                    }
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

    login = (url: string) => {
        router.post(url, async (req: Request, res: Response) => {
            try {
                const data = req.body as IUser
                const q = query(usersCollectionRef, where("username", "==", data.username))
                const [user] = await Helpers.getContain(q) as IUserDoc[]

                if (!user) return res.status(400).send({ message: "no account" })

                const isPasswordValid = await bcrypt.compare(
                    data.password!,
                    user.password!
                )
                if (!isPasswordValid) return res.status(400).send({ message: "invalid password" })
                const token = createToken(user.id, user.tokenVersion!, user.role)
                if (!user.tokenVersion) return res.sendStatus(403)
                // const VITE_OPS_COOKIE_NAME = process.env.VITE_OPS_COOKIE_NAME!
                return res
                    .status(200)
                    .send({ token: token })

            } catch (err: any) {
                res.send(err)
            }
        })
    }

    logout = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {

                        const data = req.body as IUser
                        if (data.username !== authorize.username) return res.sendStatus(401)
                        const q = query(usersCollectionRef, where("username", "==", data.username))
                        const users = await Helpers.getContain(q) as IUserDoc[]

                        if (users.length === 0) return res.status(400).send({ message: "no account" })

                        users.map(async (user) => {
                            // const VITE_OPS_COOKIE_NAME = process.env.VITE_OPS_COOKIE_NAME!
                            const updateToken = { tokenVersion: user.tokenVersion! + 1 } as IUser

                            Helpers.update(authorize.id, DBUsers, updateToken)
                            // res.clearCookie(VITE_OPS_COOKIE_NAME!, {
                            //     maxAge: 86400000, //1 day
                            //     httpOnly: true,
                            //     secure: true,
                            //     sameSite: "lax"
                            // })

                            res.json({ message: "logout" })
                        })
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (err: any) {
                res.send(err)
            }
        })
    }

    updateUser = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
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
}
