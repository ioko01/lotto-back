import { IInitialState } from "./Main";

export interface IStore extends IInitialState {
    name: string //ชื่อร้าน
    img_logo: string //โลโก้ร้าน
}