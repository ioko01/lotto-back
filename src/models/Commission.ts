import { IDigitPosition } from "./DigitPosition";
import { IInitialState } from "./Main";

export interface ICommission extends IInitialState {
    one_digits: IDigitPosition //ค่าคอมเลขวิ่ง ค่าคอมบน/ค่าคอมล่าง ==> {top:3, bottom: 4}
    two_digits: IDigitPosition //ค่าคอมเลข 2 ตัว ค่าคอมบน/ค่าคอมล่าง ==> {top:95, bottom:95}
    three_digits: IDigitPosition //ค่าคอมเลข 3 ตัว  ค่าคอมบน/ค่าคอมโต๊ด ==> {top:800, toad:125}
}