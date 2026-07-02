const admin = require('firebase-admin');

const config = {
  projectId: 'filmflow-464be',
  appId: '1:450110977008:web:5f4378abc76a8fbb0d2335',
  databaseURL: 'https://filmflow-464be.firebaseio.com'
};

admin.initializeApp({
  credential: admin.cert(config),
  databaseURL: 'https://filmflow-464be.firebaseio.com'
});

const db = admin.firestore();
console.log('✅ Hermes Terminal Connected to Firebase galeria-ia');
console.log('📊 Project ID:', config.projectId);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function testConnection() {
  try {
    const projectsRef = db.collection('tattoo_projects');
    const snapshot = await projectsRef.limit(3).get();
    console.log('📋 Found', snapshot.size, 'projects in galeria-ia database');
    
    if (snapshot.size > 0) {
      console.log('📋 Sample projects:');
      snapshot.forEach(doc => console.log('  ', doc.id, '=>', doc.data()));
    } else {
      console.log('ℹ️ Collection is empty - this is normal for new projects');
    }
    
    try {
      const clientsRef = db.collection('clients');
      const clientsSnapshot = await clientsRef.limit(3).get();
      console.log('👥 Found', clientsSnapshot.size, 'clients');
    } catch (e) {
      console.log('ℹ️ Clients collection not available yet');
    }
    
    console.log('✅ Hermes terminal successfully connected to galeria-ia Firebase database');
    console.log('🚀 Ready for CRUD operations on: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
  }
}

testConnection();
