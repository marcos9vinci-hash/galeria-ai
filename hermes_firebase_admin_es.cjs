// Conexão via Firebase Admin SDK (ESM compatible)
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from './serviceAccountKey.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = getFirestore();

console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia (Admin SDK)');
console.log('📊 Projeto:', serviceAccount.project_id);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function test() {
  try {
    const snap = await db.collection('tattoo_projects').limit(5).get();
    console.log('📋 Projetos encontrados:', snap.size);
    if (snap.size) console.log('📋 Amostra:', snap.docs[0].data());

    const clientsSnap = await db.collection('clients').limit(3).get();
    console.log('👥 Clientes encontrados:', clientsSnap.size);
    
    console.log('✅ Conexão finalizada - pronto para CRUD!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}
test();