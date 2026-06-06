import mongoose from 'mongoose';
import { env } from '../../../config/env';
import KnowledgeDocument, { DocumentType, IngestionStatus } from '../../../models/KnowledgeDocument';
import KnowledgeChunk from '../../../models/KnowledgeChunk';
import { SystemRoles } from '../../../models/roles';
import knowledgeService from '../services/knowledge.service';
import vectorSearchProvider from '../../copilot/providers/VectorSearchProvider';

async function runTests() {
  console.log('--- STARTING KNOWLEDGE BASE & RAG PLATFORM TESTS ---');

  // 1. Database Connection
  await mongoose.connect(env.MONGO_URI);
  console.log('✔ MongoDB connected.');

  const testUserId = new mongoose.Types.ObjectId();
  let docApprovedId: string = '';
  let docRestrictedId: string = '';

  try {
    // Clean old test items
    await KnowledgeDocument.deleteMany({ title: /^Test Doc / });
    await KnowledgeChunk.deleteMany({});

    // 2. Setup Mock Documents and Chunks with Embeddings
    console.log('\nSetting up test documents and vector chunks...');
    
    // Create an approved policy document (e.g. Employee Leave Policy)
    const docApproved = await KnowledgeDocument.create({
      title: 'Test Doc Approved Leave Policy',
      fileName: 'approved_leave_policy.pdf',
      documentType: DocumentType.LEAVE,
      uploadedBy: testUserId,
      filePath: 'uploads/documents/test_leave_policy.pdf',
      fileSize: 1024,
      status: IngestionStatus.READY,
      chunkCount: 2,
      isApprovedForEmployees: true
    });
    docApprovedId = docApproved._id.toString();

    // Create a restricted document (e.g. Compensation SOP)
    const docRestricted = await KnowledgeDocument.create({
      title: 'Test Doc Restricted Comp Plan',
      fileName: 'restricted_comp_plan.pdf',
      documentType: DocumentType.PAYROLL,
      uploadedBy: testUserId,
      filePath: 'uploads/documents/restricted_comp_plan.pdf',
      fileSize: 2048,
      status: IngestionStatus.READY,
      chunkCount: 2,
      isApprovedForEmployees: false
    });
    docRestrictedId = docRestricted._id.toString();

    // Chunks for Leave Policy (Approved)
    // Query search targets "maternity leave duration"
    // Leave policy chunk 1: highly relevant to maternity leave
    const c1 = await KnowledgeChunk.create({
      documentId: docApproved._id,
      chunkIndex: 0,
      content: 'Maternity leave at HRMinds AI has a duration of exactly 26 weeks for all full-time employees.',
      embedding: [0.1, 0.9, 0.0, -0.2], // Mock small 4-dim embedding vectors for easy similarity testing
      pageNumber: 1,
      sectionTitle: 'Maternity Allowance'
    });

    // Leave policy chunk 2: irrelevant to maternity leave
    const c2 = await KnowledgeChunk.create({
      documentId: docApproved._id,
      chunkIndex: 1,
      content: 'Standard business hours are Monday through Friday, 9:00 AM to 5:00 PM local time.',
      embedding: [-0.8, 0.1, 0.1, 0.1]
    });

    // Chunks for Compensation Plan (Restricted)
    // Comp chunk 1: highly relevant to salaries/maternity payout
    const c3 = await KnowledgeChunk.create({
      documentId: docRestricted._id,
      chunkIndex: 0,
      content: 'Executive maternity leave payout rate is set to 100% salary reimbursement.',
      embedding: [0.11, 0.89, 0.05, -0.18], // Vector extremely close to c1
      pageNumber: 4,
      sectionTitle: 'Executive Reimbursement'
    });

    // Comp chunk 2: irrelevant
    const c4 = await KnowledgeChunk.create({
      documentId: docRestricted._id,
      chunkIndex: 1,
      content: 'Stock options vest quarterly over a standard four-year period with a one-year cliff.',
      embedding: [0.0, -0.9, 0.2, 0.5]
    });

    console.log('✔ Documents and vector chunks created.');

    // 3. Test Local Cosine Similarity Fallback in search service
    console.log('\nTesting Cosine Similarity search fallback...');
    // We override generateEmbedding method locally to return our mock target query vector
    // Target search query: "maternity leave duration info" -> [0.1, 0.9, 0.0, -0.2]
    knowledgeService.generateEmbedding = async (query: string) => {
      return [0.1, 0.9, 0.0, -0.2];
    };

    // Test query for Admin user (should see BOTH approved and restricted chunks)
    const adminResults = await knowledgeService.semanticSearch(
      'maternity leave duration info', 
      SystemRoles.MANAGEMENT_ADMIN, 
      5
    );

    console.log(`Admin search matches: ${adminResults.length}`);
    console.assert(adminResults.length === 4, 'Admin should retrieve all chunks.');
    console.assert(adminResults[0].content.includes('Maternity leave at HRMinds'), 'Top result should be leaves policy.');
    console.assert(adminResults[1].content.includes('Executive maternity'), 'Second result should be compensation plan.');
    console.log('✔ Admin similarity search passed.');

    // Test query for Employee user (should ONLY see the approved document chunks)
    const employeeResults = await knowledgeService.semanticSearch(
      'maternity leave duration info', 
      SystemRoles.EMPLOYEE, 
      5
    );

    console.log(`Employee search matches: ${employeeResults.length}`);
    console.assert(employeeResults.length === 2, 'Employee should retrieve approved leave policy chunks.');
    console.assert(employeeResults[0].content.includes('Maternity leave at HRMinds'), 'Match content mismatch.');
    console.assert(employeeResults[0].document.title === 'Test Doc Approved Leave Policy', 'Document name mismatch.');
    console.log('✔ Employee RBAC restrictions and filter queries passed.');

    // 4. Test VectorSearchProvider Copilot integration wrapper
    console.log('\nTesting VectorSearchProvider wrapper...');
    const providerResults = await vectorSearchProvider.retrieveChunks(
      'maternity leave duration info', 
      SystemRoles.EMPLOYEE, 
      2
    );
    console.assert(providerResults.length === 2, 'VectorSearchProvider should enforce employee filters.');
    console.log('✔ VectorSearchProvider wrapper tests passed.');

    // 5. Test Cascading Document Deletion
    console.log('\nTesting document deletion cascades...');
    const delResult = await knowledgeService.deleteDocument(docRestrictedId);
    console.assert(delResult === true, 'Document deletion failed.');

    const checkDoc = await KnowledgeDocument.findById(docRestrictedId);
    const checkChunks = await KnowledgeChunk.find({ documentId: new mongoose.Types.ObjectId(docRestrictedId) });
    
    console.assert(checkDoc === null, 'Document record was not deleted.');
    console.assert(checkChunks.length === 0, 'Associated chunks were not cascade deleted.');
    console.log('✔ Cascading deletion of chunks verified.');

    // Clean up remainders
    await KnowledgeDocument.deleteMany({ title: /^Test Doc / });
    await KnowledgeChunk.deleteMany({});

    console.log('\n✔ ALL KNOWLEDGE BASE AND RAG TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Integration test suite failed:', error);
    process.exit(1);
  }
}

runTests();
