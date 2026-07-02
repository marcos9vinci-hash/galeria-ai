const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./serviceAccountKey.json');

// Use o campo correto do JSON (project_id com underscore)
const projectId = serviceAccount.project_id;

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: `https://${projectId}.firebaseio.com`
});

const db = getFirestore();

console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia');
console.log('📊 Projeto:', projectId);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function testConnection() {
  try {
    const snapshot = await db.collection('tattoo_projects').limit(5).get();
    console.log('📋 Projetos de tatuagem encontrados:', snapshot.size);
    if (snapshot.size > 0) {
      console.log('📋 Amostra:', snapshot.docs[0].data());
    }
    
    try {
      const clientsSnapshot = await db.collection('clients').limit(3).get();
      console.log('👥 Clientes encontrados:', clientsSnapshot.size);
    } catch (e) {
      console.log('ℹ️ Coleção de clientes não existe ainda');
    }
    
    console.log('🚀 Pronto para operações CRUD em:', projectId);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testConnection();