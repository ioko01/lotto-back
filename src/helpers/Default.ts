import { IBill } from "../models/Bill";
import { IStore } from "../models/Store";
import { IUser } from "../models/User";
import { db } from "../utils/firebase";
import { getDocs, addDoc, updateDoc, doc, Query, deleteDoc, CollectionReference, getDoc, DocumentReference, UpdateData } from "firebase/firestore";
import { hash } from "bcrypt";
import { GMT } from "../utils/time";
import { ILotto } from "../models/Lotto";
import { IRate } from "../models/Rate";
import { IDigitSemi } from "../models/DigitSemi";
import { IDigitClose } from "../models/DigitClose";
import { ICheckReward } from "../models/CheckReward";
import { ICommission } from "../models/Commission";
import { IBillDoc, ICheckRewardDoc, ICommissionDoc, IDigitCloseDoc, IDigitSemiDoc, ILottoDoc, IRateDoc, IStoreDoc, IUserDoc } from "../models/Id";

export class HelperController {

    getId = async (doc: DocumentReference) => {
        const id = await getDoc(doc)
        return id.data() as IBillDoc | IStoreDoc | IUserDoc | ILottoDoc | IRateDoc | IDigitSemiDoc | IDigitCloseDoc | ICheckRewardDoc | ICommissionDoc
    }

    getContain = async (q: Query) => {
        const { docs } = await getDocs(q)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IBillDoc | IStoreDoc | IUserDoc | ILottoDoc | IRateDoc | IDigitSemiDoc | IDigitCloseDoc | ICheckRewardDoc | ICommissionDoc
        })
    }


    getAll = async (reference: CollectionReference) => {
        const { docs } = await getDocs(reference)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IBillDoc | IStoreDoc | IUserDoc | ILottoDoc | IRateDoc | IDigitSemiDoc | IDigitCloseDoc | ICheckRewardDoc | ICommissionDoc
        })
    }

    add = async (reference: CollectionReference, data: IBill | IStore | IUser | ILotto | IRate | IDigitSemi | IDigitClose | ICheckReward | ICommission) => {
        return await addDoc(reference, data)
    }

    update = async (id: string, dbname: string, data: UpdateData<IBill | IStore | IUser | ILotto | IRate | IDigitSemi | IDigitClose | ICheckReward | ICommission>) => {
        const isDoc = doc(db, dbname, id)
        return await updateDoc(isDoc, data)
    }

    delete = async (id: string, dbname: string) => {
        const data = await this.getId(doc(db, dbname, id)) as IBillDoc | IStoreDoc | IUserDoc | ILottoDoc | IRateDoc | IDigitSemiDoc | IDigitCloseDoc | ICheckRewardDoc | ICommissionDoc
        if (!data) return 400

        const isDoc = doc(db, dbname, id)
        return await deleteDoc(isDoc)
    }

    create = async (reference: CollectionReference, data: IBill | IStore | IUser | ILotto | IRate | IDigitSemi | IDigitClose | ICheckReward | ICommission) => {
        return await addDoc(reference, data)
    }

    createAdmin = async (reference: CollectionReference, q: Query, data: IUser) => {
        const { docs } = await getDocs(q)

        if (docs.length === 0) {
            const { credit, fullname, password, role, status, username } = data

            const hashedPassword = await hash(
                password!,
                10
            );

            const userObj: IUser = {
                username,
                password: hashedPassword,
                fullname,
                role,
                status,
                credit,
                created_at: GMT(),
                updated_at: GMT()
            }
            await addDoc(reference, userObj)
                .then(() => {
                    return true;
                })
                .catch(() => {
                    return false
                })

        } else {
            return false;
        }
    }
}