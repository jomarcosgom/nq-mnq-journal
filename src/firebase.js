import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ================================
// CONFIGURACIÓN DE FIREBASE
// ================================
const firebaseConfig = {
  apiKey: 'AIzaSyAQqnJOgtF1a3uRKUm1Pop_X3Tv2u2dAE4',
  authDomain: 'riesgo-nq.firebaseapp.com',
  projectId: 'riesgo-nq',
  storageBucket: 'riesgo-nq.firebasestorage.app',
  messagingSenderId: '457614385052',
  appId: '1:457614385052:web:19f0da9bbf6d1218073259'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
