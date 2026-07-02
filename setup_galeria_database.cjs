// Conexão direta terminal Hermes -> Firebase galeria-ia (COM CHAVE REAL)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();
console.log('✅ Hermes Terminal CONECTADO ao Firebase galeria-ia');
console.log('📊 Projeto:', serviceAccount.project_id);
console.log('📊 Database ID: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');

async function setupDatabase() {
  try {
    // 1. Criar coleção de projetos de tatuagem
    console.log('\n📋 Criando estrutura do banco...');
    
    const projectsRef = db.collection('tattoo_projects');
    const clientsRef = db.collection('clients');
    const appointmentsRef = db.collection('appointments');
    const designsRef = db.collection('designs');
    const sessionsRef = db.collection('tattoo_sessions');
    
    // 2. Inserir dados de exemplo para projetos
    console.log('🎨 Inserindo projetos de tatuagem...');
    
    const sampleProjects = [
      {
        id: 'proj_001',
        clientName: 'Maria Silva',
        design: 'Flor de Lótus minimalista',
        style: 'fineline',
        placement: 'pulso',
        size_cm: 5,
        estimatedPrice: 400,
        status: 'agendado',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionDate: admin.firestore.Timestamp.fromDate(new Date('2026-07-15')),
        artistNotes: 'Traço fino, tinta preta, sessão única'
      },
      {
        id: 'proj_002',
        clientName: 'João Santos',
        design: 'Dragão oriental',
        style: 'traditional',
        placement: 'braço',
        size_cm: 25,
        estimatedPrice: 1200,
        status: 'em_andamento',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionDate: admin.firestore.Timestamp.fromDate(new Date('2026-07-20')),
        artistNotes: 'Sombreamento tradicional, 2 sessões'
      },
      {
        id: 'proj_003',
        clientName: 'Ana Costa',
        design: 'Mandala geométrica',
        style: 'geometric',
        placement: 'costas',
        size_cm: 15,
        estimatedPrice: 800,
        status: 'concluido',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        sessionDate: admin.firestore.Timestamp.fromDate(new Date('2026-07-10')),
        artistNotes: 'Pontilhismo, sessão única de 4h'
      }
    ];
    
    for (const project of sampleProjects) {
      await projectsRef.doc(project.id).set(project);
    }
    console.log('✅ 3 projetos de tatuagem inseridos');
    
    // 3. Inserir clientes
    console.log('👥 Inserindo clientes...');
    
    const sampleClients = [
      {
        id: 'client_001',
        name: 'Maria Silva',
        phone: '11987654321',
        email: 'maria@email.com',
        instagram: '@maria.silva',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        totalSpent: 400,
        projects: ['proj_001'],
        notes: 'Prefere traço fino, alergia a tinta vermelha'
      },
      {
        id: 'client_002',
        name: 'João Santos',
        phone: '11912345678',
        email: 'joao@email.com',
        instagram: '@joao.tattoo',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        totalSpent: 1200,
        projects: ['proj_002'],
        notes: 'Cliente recorrente, indica amigos'
      },
      {
        id: 'client_003',
        name: 'Ana Costa',
        phone: '11955556666',
        email: 'ana@email.com',
        instagram: '@ana.arts',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        totalSpent: 800,
        projects: ['proj_003'],
        notes: 'Primeira tatuagem, ansiosa'
      }
    ];
    
    for (const client of sampleClients) {
      await clientsRef.doc(client.id).set(client);
    }
    console.log('✅ 3 clientes inseridos');
    
    // 4. Inserir agendamentos
    console.log('📅 Inserindo agendamentos...');
    
    const sampleAppointments = [
      {
        id: 'apt_001',
        clientId: 'client_001',
        projectId: 'proj_001',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-15T14:00:00')),
        duration_minutes: 120,
        status: 'confirmado',
        type: 'sessao_1',
        notes: 'Trazer referência da flor de lótus',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'apt_002',
        clientId: 'client_002',
        projectId: 'proj_002',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-20T10:00:00')),
        duration_minutes: 180,
        status: 'confirmado',
        type: 'sessao_1',
        notes: 'Primeira sessão do dragão',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'apt_003',
        clientId: 'client_003',
        projectId: 'proj_003',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-10T09:00:00')),
        duration_minutes: 240,
        status: 'concluido',
        type: 'sessao_unica',
        notes: 'Mandala concluída',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const apt of sampleAppointments) {
      await appointmentsRef.doc(apt.id).set(apt);
    }
    console.log('✅ 3 agendamentos inseridos');
    
    // 5. Inserir designs
    console.log('🎨 Inserindo designs...');
    
    const sampleDesigns = [
      {
        id: 'design_001',
        projectId: 'proj_001',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/filmflow-464be.appspot.com/o/designs%2Fflor_lotus_minimal.png',
        prompt: 'Flor de lótus minimalista, traço fino, estilo coreano, preto',
        style: 'fineline',
        approved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'design_002',
        projectId: 'proj_002',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/filmflow-464be.appspot.com/o/designs%2Fdragao_oriental.png',
        prompt: 'Dragão oriental tradicional, escamas detalhadas, preto e cinza',
        style: 'traditional',
        approved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'design_003',
        projectId: 'proj_003',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/filmflow-464be.appspot.com/o/designs%2Fmandala_geometrica.png',
        prompt: 'Mandala geométrica, pontilhismo, simétrica, preto',
        style: 'geometric',
        approved: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const design of sampleDesigns) {
      await designsRef.doc(design.id).set(design);
    }
    console.log('✅ 3 designs inseridos');
    
    // 6. Inserir sessões de tatuagem
    console.log('🎯 Inserindo sessões de tatuagem...');
    
    const sampleSessions = [
      {
        id: 'session_001',
        appointmentId: 'apt_001',
        projectId: 'proj_001',
        clientId: 'client_001',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-15T14:00:00')),
        duration_minutes: 120,
        status: 'agendada',
        progress: 0,
        notes: 'Sessão única - traço fino',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'session_002',
        appointmentId: 'apt_002',
        projectId: 'proj_002',
        clientId: 'client_002',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-20T10:00:00')),
        duration_minutes: 180,
        status: 'em_andamento',
        progress: 50,
        notes: 'Primeira sessão - contorno do dragão',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        id: 'session_003',
        appointmentId: 'apt_003',
        projectId: 'proj_003',
        clientId: 'client_003',
        date: admin.firestore.Timestamp.fromDate(new Date('2026-07-10T09:00:00')),
        duration_minutes: 240,
        status: 'concluida',
        progress: 100,
        notes: 'Mandala finalizada com pontilhismo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const session of sampleSessions) {
      await sessionsRef.doc(session.id).set(session);
    }
    console.log('✅ 3 sessões de tatuagem inseridas');
    
    // 7. Verificar tudo
    console.log('\n🔍 Verificando estrutura do banco...');
    
    const collections = ['tattoo_projects', 'clients', 'appointments', 'designs', 'tattoo_sessions'];
    for (const coll of collections) {
      const snap = await db.collection(coll).get();
      console.log(`   📁 ${coll}: ${snap.size} documentos`);
    }
    
    console.log('\n🎉 BANCO DE DADOS GALERIA-IA CRIADO COM SUCESSO!');
    console.log('📊 Database: ai-studio-galeriaiatattooc-ce38ece0-6c9b-4ceb-80c9-38b6c3c17de2');
    console.log('🔗 Projeto: filmflow-464be');
    console.log('\n📋 Coleções criadas:');
    console.log('   • tattoo_projects (projetos de tatuagem)');
    console.log('   • clients (clientes)');
    console.log('   • appointments (agendamentos)');
    console.log('   • designs (designs aprovados)');
    console.log('   • tattoo_sessions (sessões de tatuagem)');
    console.log('\n✅ Pronto para uso pelo app galeria-ia e ferramentas AI externas!');
    
  } catch (error) {
    console.error('❌ Erro ao criar banco:', error.message);
  }
}

setupDatabase();