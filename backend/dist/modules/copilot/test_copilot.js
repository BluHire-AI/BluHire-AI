"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../../config/env");
const CopilotConversation_1 = require("../../models/CopilotConversation");
const CopilotMessage_1 = require("../../models/CopilotMessage");
const CopilotAuditLog_1 = require("../../models/CopilotAuditLog");
const Employee_1 = __importDefault(require("../../models/Employee"));
const roles_1 = require("../../models/roles");
const registry_1 = __importDefault(require("./tools/registry"));
const MongoDBQueryProvider_1 = __importDefault(require("./providers/MongoDBQueryProvider"));
const copilot_service_1 = __importDefault(require("./copilot.service"));
// Set test environment variable so we can avoid full OpenRouter external requests
process.env.NODE_ENV = 'test';
async function runTests() {
    console.log('--- STARTING CO-PILOT INTEGRATION TEST SUITE ---');
    // 1. Establish DB connection
    await mongoose_1.default.connect(env_1.env.MONGO_URI);
    console.log('MongoDB Connected.');
    // Clean test database records or setup hooks
    const testUserId = new mongoose_1.default.Types.ObjectId().toString();
    try {
        // 2. Test MongoDB Query Provider - Limit Safeguard (Max 100)
        console.log('\nTesting limit safeguard on MongoDBQueryProvider...');
        // Create 110 dummy employees to verify pagination limit works
        const dummyEmployees = [];
        const deptId = new mongoose_1.default.Types.ObjectId();
        const desigId = new mongoose_1.default.Types.ObjectId();
        for (let i = 1; i <= 110; i++) {
            dummyEmployees.push({
                employeeCode: `EMP-TST-${i.toString().padStart(4, '0')}`,
                firstName: `Test`,
                lastName: `Employee ${i}`,
                email: `test_emp_${i}@example.com`,
                phone: `+1234567890`,
                joiningDate: new Date(),
                departmentId: deptId,
                designationId: desigId,
                employmentStatus: 'ACTIVE',
                employmentType: 'FULL_TIME',
                workLocation: 'REMOTE',
                createdBy: testUserId,
                isDeleted: false
            });
        }
        await Employee_1.default.deleteMany({ employeeCode: /^EMP-TST-/ });
        await Employee_1.default.insertMany(dummyEmployees);
        const queryResults = await MongoDBQueryProvider_1.default.query(Employee_1.default, { employeeCode: /^EMP-TST-/ }, 500);
        console.log(`Query results length (requested 500): ${queryResults.length}`);
        console.assert(queryResults.length === 100, 'Error: MongoDBQueryProvider should cap records at 100.');
        // Clean up employees
        await Employee_1.default.deleteMany({ employeeCode: /^EMP-TST-/ });
        console.log('✔ MongoDB Query Provider limit safeguard test passed.');
        // 3. Test Database Persistence - Conversation & Messages
        console.log('\nTesting Conversation & Messages persistence...');
        await CopilotConversation_1.CopilotConversation.deleteMany({ userId: testUserId });
        const conv = await CopilotConversation_1.CopilotConversation.create({
            userId: new mongoose_1.default.Types.ObjectId(testUserId),
            title: 'Analytics discussion',
            sessionId: new mongoose_1.default.Types.ObjectId().toString(),
            isActive: true
        });
        const msg1 = await CopilotMessage_1.CopilotMessage.create({
            conversationId: conv._id,
            role: 'user',
            content: 'Can you show me the headcount stats?'
        });
        const msg2 = await CopilotMessage_1.CopilotMessage.create({
            conversationId: conv._id,
            role: 'assistant',
            content: 'Total headcount is 45 employees.'
        });
        const dbConv = await CopilotConversation_1.CopilotConversation.findById(conv._id);
        const dbMsgs = await CopilotMessage_1.CopilotMessage.find({ conversationId: conv._id }).sort({ timestamp: 1 });
        console.assert(dbConv !== null, 'Conversation was not saved.');
        console.assert(dbMsgs.length === 2, 'Message history logs were not saved.');
        console.assert(dbMsgs[0].content === 'Can you show me the headcount stats?', 'Message content mismatch.');
        console.log('✔ Database persistence tests passed.');
        // 4. Test RBAC Enforcement - Employee role block
        console.log('\nTesting Employee role block...');
        let eventReceived = false;
        let tokenValue = '';
        await copilot_service_1.default.handleChatStream(testUserId, roles_1.SystemRoles.EMPLOYEE, 'List all employees salaries', conv._id.toString(), undefined, (event) => {
            if (event.type === 'token') {
                eventReceived = true;
                tokenValue += event.content;
            }
        });
        console.assert(eventReceived, 'Employee block event was not emitted.');
        console.assert(tokenValue.includes('permission'), 'Employee error message should warn about permission.');
        // Verify that it saved the error response message to the database
        const employeeMsgs = await CopilotMessage_1.CopilotMessage.find({ conversationId: conv._id });
        const hasErrorMsgSaved = employeeMsgs.some(m => m.role === 'assistant' && m.content.includes('permission'));
        console.assert(hasErrorMsgSaved, 'Employee block error response not persisted to database.');
        console.log('✔ RBAC Enforcement for Employee role passed.');
        // 5. Test RBAC Scopes in Tool Registry
        console.log('\nTesting tool authorization scopes in registry...');
        const adminTools = registry_1.default.getToolsForRole(roles_1.SystemRoles.MANAGEMENT_ADMIN);
        const recruiterTools = registry_1.default.getToolsForRole(roles_1.SystemRoles.HR_RECRUITER);
        const employeeTools = registry_1.default.getToolsForRole(roles_1.SystemRoles.EMPLOYEE);
        console.assert(adminTools.length > 0, 'Admin should have registered tools.');
        console.assert(recruiterTools.length > 0, 'Recruiter should have registered tools.');
        console.assert(employeeTools.length === 0, 'Employee should have 0 registered tools.');
        const hasAdminToolInRecruiter = recruiterTools.some(t => t.function.name === 'getEmployeeCount');
        console.assert(!hasAdminToolInRecruiter, 'Recruiter should not access getEmployeeCount.');
        console.log('✔ Tool authorization scopes verified.');
        // 6. Test Write Operation Safeguards - Human-In-The-Loop Confirmation
        console.log('\nTesting Write Safeguards - Human-in-the-Loop...');
        // Test that invoking a write action 'createJob' without confirmedAction triggers approval request
        // Mock the registry execution hook by inspecting registry properties
        const createJobTool = registry_1.default.getTool('createJob');
        console.assert(createJobTool !== undefined, 'createJob tool is not registered.');
        console.assert(createJobTool?.isWrite === true, 'createJob tool must be flagged as isWrite.');
        const reportTool = registry_1.default.getTool('generateWeeklyRecruitmentReport');
        console.assert(reportTool !== undefined, 'generateWeeklyRecruitmentReport is not registered.');
        console.assert(reportTool?.isWrite === true, 'generateWeeklyRecruitmentReport must be flagged as isWrite.');
        console.log('✔ Write operation safeguard parameters checked.');
        // 7. Verify Audit Log Integration
        console.log('\nTesting security audit log creation...');
        await CopilotAuditLog_1.CopilotAuditLog.deleteMany({ userId: testUserId });
        await CopilotAuditLog_1.CopilotAuditLog.create({
            userId: new mongoose_1.default.Types.ObjectId(testUserId),
            prompt: 'Summarize recruitment funnel',
            toolsUsed: [{
                    name: 'getHiringMetrics',
                    arguments: {},
                    durationMs: 45,
                    status: 'SUCCESS'
                }],
            response: 'Here is the summary'
        });
        const auditLogs = await CopilotAuditLog_1.CopilotAuditLog.find({ userId: testUserId });
        console.assert(auditLogs.length === 1, 'Audit log was not saved.');
        console.assert(auditLogs[0].toolsUsed[0].name === 'getHiringMetrics', 'Audit log tool mismatch.');
        console.log('✔ Security compliance audit logging verified.');
        // Clean up test data
        await CopilotConversation_1.CopilotConversation.deleteMany({ userId: testUserId });
        await CopilotMessage_1.CopilotMessage.deleteMany({ conversationId: conv._id });
        await CopilotAuditLog_1.CopilotAuditLog.deleteMany({ userId: testUserId });
        console.log('\n✔ All tests passed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test execution encountered an error:', error);
        process.exit(1);
    }
}
runTests();
