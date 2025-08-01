import { db as dbAdmin } from "./firebaseAdminConfig.js";
import * as admin from 'firebase-admin';

export async function deleteCollection(collectionRef: admin.firestore.CollectionReference, batchSize: number) {
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(query: admin.firestore.Query, resolve: Function) {
    const snapshot = await query.get();

    // Cuando no hay documentos restantes, hemos terminado
    if (snapshot.size === 0) {
        resolve();
        return;
    }

    // Eliminar documentos en un batch
    const batch = dbAdmin.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Recursión para eliminar el siguiente batch
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}