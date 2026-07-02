// Conexão direta terminal Hermes -> Firebase galeria-ia
const admin = require('firebase-admin');
const config = JSON.parse(require('fs').readFileSync('./firebase-applet-config.json', 'utf8'));

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: 'https://' + config.projectId + '.firebaseio.com'
});

const db = admin.firestore();
console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia');
console.log('📊 Projeto:', config.projectId);
console.log('📊 Database ID:', config.firestoreDatabaseId);

async function testConnection() {
  try {
    const snapshot = await db.collection('tattoo_projects').limit(5).get();
    console.log('📋 Projetos de tatuagem encontrados:', snapshot.size);
    if (snapshot.size > 0) {
      console.log('📋 Amostra:', snapshot.docs[0].data());
    }
    console.log('🚀 Pronto para operações CRUD em:', config.firestoreDatabaseId);
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

testConnection();