import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase.js';

const ACCOUNTS_COLLECTION = 'accounts';
const STORAGE_KEY = 'nqmnq.activeAccountId';

export const ALL_ACCOUNTS = 'all';

/**
 * Cuentas de trading del usuario (personales o de fondeo) con sus reglas
 * personalizadas. Mantiene también cuál es la cuenta activa, persistida en
 * localStorage para que se conserve entre recargas.
 */
export function useAccounts(user) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAccountId, setActiveAccountId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ALL_ACCOUNTS
  );

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, ACCOUNTS_COLLECTION), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ firestoreId: d.id, ...d.data() }));
        list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        setAccounts(list);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeAccountId);
  }, [activeAccountId]);

  // Si la cuenta activa se borra, volvemos a la vista global.
  useEffect(() => {
    if (loading || activeAccountId === ALL_ACCOUNTS) return;
    if (!accounts.some((a) => a.firestoreId === activeAccountId)) {
      setActiveAccountId(ALL_ACCOUNTS);
    }
  }, [accounts, activeAccountId, loading]);

  const activeAccount = useMemo(
    () => accounts.find((a) => a.firestoreId === activeAccountId) || null,
    [accounts, activeAccountId]
  );

  async function addAccount(account) {
    const ref = await addDoc(collection(db, ACCOUNTS_COLLECTION), {
      ...account,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
    return ref.id;
  }

  async function updateAccount(firestoreId, data) {
    const { userId, firestoreId: _ignored, ...rest } = data;
    await updateDoc(doc(db, ACCOUNTS_COLLECTION, firestoreId), rest);
  }

  async function deleteAccount(firestoreId) {
    await deleteDoc(doc(db, ACCOUNTS_COLLECTION, firestoreId));
  }

  return {
    accounts,
    loading,
    activeAccountId,
    activeAccount,
    setActiveAccountId,
    addAccount,
    updateAccount,
    deleteAccount
  };
}
