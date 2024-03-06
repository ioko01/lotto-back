
import { ILottoDoc } from "./Id";
import { FirebaseTimestamp, IInitialState } from "./Main";

export interface ICheckReward extends IInitialState {
    lotto_id: ILottoDoc //ไอดีหวย
    times: Date | FirebaseTimestamp //งวดที่ออก
    top: string //ผลที่ออก 153
    bottom: string //ผลที่ออก 68
}