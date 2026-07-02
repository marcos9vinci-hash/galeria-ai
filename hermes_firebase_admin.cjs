// Conexão via Firebase Admin SDK com service account
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia (Admin SDK)');
console.log('📊 Projeto:', serviceAccount.project_id);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function testConnection() {
  try {
    const projectsRef = db.collection('tattoo_projects');
    const snapshot = await projectsRef.limit(5).get();
    
    console.log('📋 Projetos de tatuagem encontrados:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('📋 Amostra:');
      snapshot.forEach(doc => console.log('  ID:', doc.id, '| Dados:', doc.data()));
    } else {
      console.log('ℹ️ Coleção vazia (normal para novo projeto)');
    }
    
    // Testar coleção clients
    try {
      const clientsRef = db.collection('clients');
      const clientsSnap = await clientsRef.limit(3).get();
      console.log('👥 Clientes encontrados:', clientsSnap.size);
    } catch (e) {
      console.log('ℹ️ Coleção clients não disponível ainda');
    }
    
    console.log('✅ Conexão finalizada - pronto para CRUD!');
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testConnection();