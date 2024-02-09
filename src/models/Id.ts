import { IBill } from "./Bill";
import { ICheckReward } from "./CheckReward";
import { ICommission } from "./Commission";
import { IDigitClose } from "./DigitClose";
import { IDigitSemi } from "./DigitSemi";
import { ILotto } from "./Lotto";
import { IRate } from "./Rate";
import { IStore } from "./Store";
import { IUser } from "./User";

export interface ILottoDoc extends ILotto {
    id: string
}

export interface IRateDoc extends IRate {
    id: string
}

export interface IBillDoc extends IBill {
    id: string
}

export interface IDigitCloseDoc extends IDigitClose {
    id: string
}

export interface IStoreDoc extends IStore {
    id: string
}

export interface IUserDoc extends IUser {
    id: string
}

export interface ICheckRewardDoc extends ICheckReward {
    id: string
}

export interface IDigitSemiDoc extends IDigitSemi {
    id: string;
}

export interface ICommissionDoc extends ICommission {
    id: string;
}
