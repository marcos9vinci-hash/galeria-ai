const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = getFirestore();

console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia (Admin SDK)');
console.log('📊 Projeto:', serviceAccount.project_id);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function testConnection() {
  try {
    const projectsRef = db.collection('tattoo_projects');
    const snapshot = await projectsRef.limit(5).get();
    
    console.log('📋 Projetos de tatuagem encontrados:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('📋 Amostra:', snapshot.docs[0].data());
    } else {
      console.log('ℹ️ Coleção vazia (normal para novo projeto)');
    }
    
    const clientsSnap = await db.collection('clients').limit(3).get();
    console.log('👥 Clientes encontrados:', clientsSnap.size);
    
    console.log('✅ Conexão finalizada - pronto para CRUD!');
  } catch (e) {
    console.error('❌ Erro:', e.message);
  }
}
testConnection();