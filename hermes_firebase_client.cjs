// Conexão via Firebase Client SDK (não precisa de service account)
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

const config = JSON.parse(require('fs').readFileSync('./firebase-applet-config.json', 'utf8'));

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia (Client SDK)');
console.log('📊 Projeto:', config.projectId);
console.log('📊 Database ID:', config.firestoreDatabaseId);

async function testConnection() {
  try {
    const projectsRef = collection(db, 'tattoo_projects');
    const q = query(projectsRef, limit(5));
    const snapshot = await getDocs(q);
    
    console.log('📋 Projetos de tatuagem encontrados:', snapshot.size);
    
    if (snapshot.size > 0) {
      console.log('📋 Amostra:');
      snapshot.forEach(doc => console.log('  ID:', doc.id, '| Dados:', doc.data()));
    } else {
      console.log('ℹ️ Coleção vazia (normal para novo projeto)');
    }
    
    // Testar coleção clients
    try {
      const clientsRef = collection(db, 'clients');
      const clientsSnap = await getDocs(query(clientsRef, limit(3)));
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