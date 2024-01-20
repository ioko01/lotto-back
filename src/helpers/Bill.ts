import { IBill } from "../models/Bill";
import { DBBills, billsCollectionRef, db } from "../utils/firebase";
import { getDocs, addDoc, updateDoc, doc, Query, deleteDoc } from "firebase/firestore";

export interface IBillDoc extends IBill {
    id: string;
}

export class BillController {

    getContain = async (q: Query, db: string) => {
        const { docs } = await getDocs(q)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IBillDoc
        })
    }


    getAll = async () => {
        const { docs } = await getDocs(billsCollectionRef)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IBillDoc
        })
    }

    add = async (bill: IBill) => {
        return await addDoc(billsCollectionRef, bill)
    }

    update = async (id: string, bill: IBill) => {
        const tutorialDoc = doc(db, DBBills, id)
        return await updateDoc(tutorialDoc, DBBills, bill)
    }

    delete = async (id: string) => {
        const billDoc = doc(db, DBBills, id)
        return await deleteDoc(billDoc)
    }
}