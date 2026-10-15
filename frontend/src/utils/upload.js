// @feature core — Envoi d'une image vers Firebase Storage
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../services/firebase.js";

export function uploadImage(file) {
    return new Promise((resolve, reject) => {
        const storageRef = ref(storage, `images/${file.name}-${Date.now()}`);
        const uploadTask = uploadBytesResumable(storageRef, file, { contentType: file.type });

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log(`Upload is ${progress}% done`);
            },
            (error) => reject(error),
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
        );
    });
}
