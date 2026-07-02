const admin = require('firebase-admin');
const config = {
  projectId: 'filmflow-464be',
  appId: '1:450110977008:web:5f4378abc76a8fbb0d2335',
  apiKey: 'AIzaS...',
  authDomain: 'filmflow-464be.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2',
  storageBucket: 'filmflow-464be.firebasestorage.app',
  messagingSenderId: '450110977008',
  measurementId: 'G-QHGL7CF210'
};

admin.initializeApp({
  credential: admin.credential.cert(config),
  databaseURL: 'https://' + config.projectId + '.firebaseio.com'
});

const db = admin.firestore();
console.log('✅ CONEXÃO BEM-SUCEDIDA');
console.log('📊 Projeto:', config.projectId);
console.log('📊 Banco de dados:', config.firestoreDatabaseId);

async function testConnection() {
  try {
    const projectsSnapshot = await db.collection('tattoo_projects').limit(3).get();
    console.log('📋 Projetos de tatuagem encontrados:', projectsSnapshot.size);
    
    if (projectsSnapshot.size > 0) {
      console.log('📋 Amostra:');
      projectsSnapshot.forEach(doc => console.log('  ID:', doc.id, '| Dados:', doc.data()));
    } else {
      console.log('ℹ️ Coleção está vazia (normal para um novo projeto)');
    }
    
    try {
      const clientsSnapshot = await db.collection('clients').limit(3).get();
      console.log('👥 Clientes encontrados:', clientsSnapshot.size);
    } catch (e) {
      console.log('ℹ️ Coleção de clientes não existe ainda');
    }
    
    console.log('✅ Conexão com o banco de dados galeria-ia finalizada com sucesso!');
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    console.log('ℹ️ Isso pode significar que as credenciais do projeto estão incorretas');
  }
}

testConnection();
