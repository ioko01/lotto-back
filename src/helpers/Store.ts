import { IStore } from "../models/Store";
import { db, storesCollectionRef, DBStores } from "../utils/firebase";
import { getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

export interface IStoreDoc extends IStore {
    id: string;
}

export class StoreController {

    getContain = async () => {
        const { docs } = await getDocs(storesCollectionRef)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IStoreDoc
        })
    }

    getMe = async () => {
        const { docs } = await getDocs(storesCollectionRef)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IStoreDoc
        })
    }

    getAll = async () => {
        const { docs } = await getDocs(storesCollectionRef)
        return docs.map((doc) => {
            return { ...doc.data(), id: doc.id } as IStoreDoc
        })
    }

    add = async (store: IStore) => {
        return await addDoc(storesCollectionRef, store)
    }

    update = async (id: string, store: IStore) => {
        const tutorialDoc = doc(db, DBStores, id)
        return await updateDoc(tutorialDoc, DBStores, store)
    }
}