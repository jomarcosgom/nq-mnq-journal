import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase.js';

const TRADES_COLLECTION = 'trades';

/**
 * Se suscribe a las operaciones del usuario indicado en Firestore en
 * tiempo real, y expone funciones para añadir, actualizar, borrar y
 * vaciar su historial. Cada documento lleva un campo `userId` para que
 * las reglas de seguridad de Firestore puedan aislar los datos entre
 * cuentas distintas.
 *
 * @param {object|null} user - objeto de usuario de Firebase Auth, o null.
 */
export function useJournalEntries(user) {
  const [entries, setEntries] = useState([]);
  const [syncState, setSyncState] = useState('connecting'); // connecting | online | error

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    setSyncState('connecting');
    const q = query(
      collection(db, TRADES_COLLECTION),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setEntries(snapshot.docs.map((d) => ({ firestoreId: d.id, ...d.data() })));
        setSyncState('online');
      },
      (err) => {
        console.error(err);
        setSyncState('error');
      }
    );

    return () => unsubscribe();
  }, [user]);

  async function addEntry(entry) {
    await addDoc(collection(db, TRADES_COLLECTION), { ...entry, userId: user.uid });
  }

  async function updateEntry(firestoreId, entry) {
    // No se toca userId al actualizar, para que siga perteneciendo al
    // mismo usuario que la creó.
    await updateDoc(doc(db, TRADES_COLLECTION, firestoreId), entry);
  }

  async function deleteEntry(firestoreId) {
    await deleteDoc(doc(db, TRADES_COLLECTION, firestoreId));
  }

  async function clearAll() {
    const batch = writeBatch(db);
    entries.forEach((e) => batch.delete(doc(db, TRADES_COLLECTION, e.firestoreId)));
    await batch.commit();
  }

  return { entries, syncState, addEntry, updateEntry, deleteEntry, clearAll };
}
