import { ILottoDoc, IRateDoc, IStoreDoc } from "../helpers/Default";
import { IDigitPosition } from "./DigitPosition";
import { ILotto } from "./Lotto";
import { IInitialState } from "./Main";
import { IRate } from "./Rate";
import { IStore } from "./Store";

export interface IDigitClose extends IInitialState {
    store_id: IStoreDoc //ไอดีร้าน
    lotto_id: ILottoDoc //ไอดีหวย
    rate_id: IRateDoc //ไอดีเรทการจ่าย
    percent: number //เปอร์เซ้นต์การจ่าย ค่าเริ่มต้น 0
    one_digits?: IDigitPosition //วิ่ง ==> {top: [1, 2, 3], bottom: [1, 2, 3]}
    two_digits?: IDigitPosition //2 ตัว {top: [01, 22, 63], bottom: [81, 52, 63]}
    three_digits?: IDigitPosition //3 ตัว {top: [051, 222, 631], toad:[831, 542, 673]}
}