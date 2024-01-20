import { NextFunction, Request, Response } from "express"
import { router } from "../server"
import { TUserRole } from "../models/User"
import { authorization } from "../middleware/authorization"
import { UploadedFile } from 'express-fileupload'
import path from "path"

export class ApiFile {

    uploadFile = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.post(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        if (req.files) {
                            const file = req.files.File as UploadedFile
                            const filename = file.name
                            if (file.mimetype.match("image/")) {
                                file.mv(`./src/uploads/${filename}`, (err) => {
                                    if (err) return res.send(err)
                                    return res.send("File Uploaded")
                                })
                            } else {
                                return res.send("Memetype not match")
                            }
                        }
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (error) {

            }
        })
    }

    previewFile = (url: string, middleware: (req: Request, res: Response, next: NextFunction) => void, roles: TUserRole[]) => {
        router.get(url, middleware, async (req: Request, res: Response) => {
            try {
                const authorize = await authorization(req, roles)
                if (authorize) {
                    if (authorize !== 401) {
                        const options = {
                            root: path.join(`./dist/uploads/`)
                        };
                        return res.sendFile(req.params.file, options, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        })
                    } else {
                        return res.sendStatus(authorize)
                    }
                } else {
                    return res.sendStatus(401)
                }
            } catch (error) {

            }
        })
    }
}