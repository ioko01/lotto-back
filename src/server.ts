import express, { Application, NextFunction, Request, Response } from 'express'
import bodyParser from "body-parser";
import cors from "cors";
import { config } from 'dotenv'
import { ApiBill } from './routes/bill';
import { ApiUser } from './routes/user';
import { ApiStore } from './routes/store';
import { PORT, corsOption, socketServerOption } from './config/default';
import cookieParser from 'cookie-parser';
import { authenticate } from './middleware/authenticate';
import { ApiLotto } from './routes/lotto';
import { ApiRate } from './routes/rate';
import { ApiDigitSemi } from './routes/digitSemi';
import { ApiDigitClose } from './routes/digitClose';
import { ApiCheckReward } from './routes/checkReward';
import serverless from "serverless-http";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData } from './utils/socket-io';
import { digitCloseHandler } from './socket/digitCloseHandler';
import { userHandler } from './socket/userHandler';
import { storeHandler } from './socket/storeHandler';
import { authorization } from './middleware/authorization';
import { TUserRole } from './models/User';
import upload from 'express-fileupload'
import { ApiFile } from './routes/file';
import { createServer, proxy } from 'aws-serverless-express';
import { Handler } from '@netlify/functions';

config()

export const APP: Application = express()
export const router = express.Router()

const server = http.createServer(APP)
export const io = new SocketIOServer(server, socketServerOption)

// APP.set("trust proxy", 1)
APP.use(cookieParser())
APP.use(cors(corsOption))
APP.use(bodyParser.json())
APP.use(upload())

const Bill = new ApiBill()
const User = new ApiUser()
const Store = new ApiStore()
const Lotto = new ApiLotto()
const Rate = new ApiRate()
const DigitSemi = new ApiDigitSemi()
const DigitClose = new ApiDigitClose()
const CheckReward = new ApiCheckReward()
const File = new ApiFile()


io.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {

    digitCloseHandler(socket)
    userHandler(socket)
    storeHandler(socket)

    socket.on("disconnect", () => {
        console.log("user is disconnected");
    })
})


// :id = ไอดีที่ต้องการ :store = ไอดีร้าน
Bill.getBillAllMe('/get/bill/id/:id', authenticate, ["ADMIN", "AGENT", "MANAGER"])// ดูบิลทั้งหมดของร้านตัวเอง
Bill.getBillAll('/get/bill/all', authenticate, ["ADMIN"])// ดูบิลทั้งหมด
Bill.getBillMe('/get/bill/me', authenticate, ["MEMBER"])// ดูบิลของฉัน
Bill.addBill('/add/bill', authenticate, ["MEMBER"]) // เพิ่มบิล
// Bill.updateBill('/update/bill', authenticate, ["MANAGER"])
Bill.deleteBill('/delete/bill', authenticate, ["MANAGER", "MEMBER"])

// Lotto.getLottoId('/get/lotto/id/:id', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
// Lotto.getLottoMe('/get/lotto/me', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
Lotto.getLottoAll('/get/lotto/all', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
Lotto.getLottoId('/get/lotto/id/:id', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
Lotto.addLotto('/add/lotto', authenticate, ["ADMIN"])
Lotto.updateLotto('/update/lotto', authenticate, ["ADMIN"])
Lotto.statusLotto('/status/lotto', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
Lotto.deleteLotto('/delete/lotto', authenticate, ["ADMIN"])

Store.getStoreAllMe('/get/store/me/:id', authenticate, ["ADMIN", "AGENT"])// agent ดูร้านในเครือข่ายของตัวเอง
Store.getStoreMe('/get/store/me', authenticate, ["ADMIN", "AGENT", "MANAGER", "MANAGE_REWARD", "MEMBER"])// ดูร้านของตัวเอง
Store.getStoreAll('/get/store', authenticate, ["ADMIN"])//ดูร้านทุกร้าน
Store.addStore('/add/store', authenticate, ["ADMIN", "AGENT"])//เพิ่มร้าน
Store.updateStore('/add/store', authenticate, ["ADMIN", "AGENT"])//อัพเดตร้าน
Store.deleteStore('/add/store', authenticate, ["ADMIN", "AGENT"])//ลบร้าน (ทำเป็นสถานะลบออกเฉยๆ)

Rate.getRateAllMe('/get/rate/me/all', authenticate, ["ADMIN", "AGENT"])// ดูเรทราคาในเครือข่ายของตัวเอง
Rate.getRateMe('/get/rate/me', authenticate, ["MANAGER", "MEMBER"])// ดูเรทราคาของร้านตัวเอง

Rate.getRateAll('/get/rate', authenticate, ["ADMIN"])// ดูเรทราคาทุกร้าน
Rate.getRateId('/get/rate/id/:id', authenticate, ["ADMIN", "AGENT", "MANAGER", "MANAGE_REWARD", "MEMBER"])// ดูเรทราคาทุกร้าน
Rate.addRate('/add/rate', authenticate, ["ADMIN", "AGENT"])// เพิ่มเรทราคา
Rate.updateRate('/add/rate', authenticate, ["ADMIN", "AGENT"])
Rate.deleteRate('/add/rate', authenticate, ["ADMIN", "AGENT"])

DigitSemi.getDigitSemiId('/get/digitsemi', authenticate, ["ADMIN", "AGENT"])// ดูเลขจ่ายครึ่งในเครือข่ายของตัวเอง
DigitSemi.getDigitSemiMe('/get/digitsemi', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])// ดูเลขจ่ายครึ่งของร้านตัวเอง
DigitSemi.getDigitSemiAll('/get/digitsemi', authenticate, ["ADMIN"])// ดูเลขจ่ายครึ่งของทุกร้าน
DigitSemi.addDigitSemi('/add/digitsemi', authenticate, ["ADMIN", "AGENT"])
DigitSemi.updateDigitSemi('/add/digitsemi', authenticate, ["ADMIN", "AGENT"])
DigitSemi.deleteDigitSemi('/add/digitsemi', authenticate, ["ADMIN", "AGENT"])

DigitClose.getDigitCloseId('/get/digitclose/id/:id', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
DigitClose.getDigitCloseMe('/get/digitclose/me', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])
DigitClose.getDigitCloseAll('/get/digitclose/all', authenticate, ["ADMIN"])
DigitClose.addDigitClose('/add/digitclose', authenticate, ["ADMIN", "AGENT"])
DigitClose.updateDigitClose('/update/digitclose', authenticate, ["ADMIN", "AGENT"])
DigitClose.deleteDigitClose('/delete/digitclose', authenticate, ["ADMIN", "AGENT"])

// CheckReward.getCheckRewardId('/get/store', authenticate, ["ADMIN", "AGENT", "MANAGER"])
// CheckReward.getCheckRewardMe('/get/store', authenticate, ["ADMIN", "AGENT", "MANAGER"])
CheckReward.getCheckRewardAll('/get/store', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER", "MANAGE_REWARD"])
CheckReward.addCheckReward('/add/store', authenticate, ["ADMIN", "AGENT", "MANAGE_REWARD"])
CheckReward.updateCheckReward('/add/store', authenticate, ["ADMIN", "AGENT", "MANAGE_REWARD"])
CheckReward.deleteCheckReward('/add/store', authenticate, ["ADMIN", "AGENT", "MANAGE_REWARD"])

User.getUserAll('/get/user/all', authenticate, ["ADMIN"])// ดูผู้ใช้งานทั้งหมด
User.getUserAllIsRole('/get/user/role/:role', authenticate, ["ADMIN"])// ดูผู้ใช้งานตำแหน่ง
User.getUserAllMe('/get/user/me', authenticate, ["ADMIN", "AGENT", "MANAGER"])// ดูผู้ใช้งานลูกข่ายตัวเอง
User.getMe('/me', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER", "MANAGE_REWARD"])// ดูข้อมูลตัวเอง
User.getUsername('/username', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER", "MANAGE_REWARD"])// ดูข้อมูลไอดี
User.getId('/id', authenticate, ["ADMIN"])// ดูข้อมูลไอดี

User.credit('/:excute/credit', authenticate, ["ADMIN", "AGENT", "MANAGER"])// เครดิต (เพิ่ม/ลบ)

User.statusAgent('/update/status/agent', authenticate, ["ADMIN"])// เครดิต (เพิ่ม/ลบ)
User.statusManager('/status/manager/:store', authenticate, ["ADMIN", "AGENT"])// เครดิต (เพิ่ม/ลบ)
User.statusMember('/status/member/:store', authenticate, ["ADMIN", "AGENT", "MANAGER"])// เครดิต (เพิ่ม/ลบ)

User.addUserAdmin('/add/admin')// เพิ่ม admin
User.addUserAgent('/add/agent', authenticate, ["ADMIN"])// เพิ่ม agent
User.addUserManager('/add/manager', authenticate, ["ADMIN", "AGENT"])// เพิ่ม manager
User.addUserMember('/add/member', authenticate, ["ADMIN", "AGENT", "MANAGER"])// เพิ่ม member

User.deleteUserAgent('/delete/agent', authenticate, ["ADMIN"])// ลบ agent
User.deleteUserManager('/delete/manager', authenticate, ["ADMIN", "AGENT"])// เพิ่ม manager
User.deleteUserMember('/delete/member', authenticate, ["ADMIN", "AGENT", "MANAGER"])// เพิ่ม member

User.login('/auth/login')// login
User.logout('/auth/logout', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])// logout

File.uploadFile('/upload/file', authenticate, ["ADMIN", "AGENT", "MANAGER"])
File.previewFile('/get/file/:file', authenticate, ["ADMIN", "AGENT", "MANAGER", "MEMBER"])

// เหลือสร้าง ประกาศ (เช่น ประกาศว่าหวยนี้เลื่อนไปเปิดเวลาไหน)


// สร้าง admin
// admin สร้างหวย เวลาเปิด เวลาปิดรับหวย
// admin เพิ่ม agent
// agent เพิ่ม ร้าน
// agent กำหนดเรทการจ่ายของแต่ละหวย & ค่าคอมมิชชั่น
// agent เพิ่ม manager และเลือกว่า manager คนนี้จะคุมร้านไหน
// agent เพิ่ม credit ให้ manager
// manager เพิ่ม member
// manager เพิ่ม credit ให้ member
// member เพิ่มบิล
// รอผลออกและให้ MANAGE_REWARD เป็นคนกรอกผล
router.get("/", (_, res: Response) => {
    res.send("Welcome to API")
})

APP.use("/", router)

server.listen(PORT, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
// export const handler = serverless(APP);
// export const handler: Handler = (event: any, context: any) => {
//     proxy(server, event, context);
// };
