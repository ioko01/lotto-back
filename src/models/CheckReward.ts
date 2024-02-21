
import { ILottoDoc } from "./Id";
import { IInitialState } from "./Main";

export interface ICheckReward extends IInitialState {
    lotto_id: ILottoDoc //ไอดีหวย
    times: string //งวดที่ออก
    top: string //ผลที่ออก 153
    bottom: string //ผลที่ออก 68
}