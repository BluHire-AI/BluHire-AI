"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CopilotService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const CopilotConversation_1 = require("../../models/CopilotConversation");
const CopilotMessage_1 = require("../../models/CopilotMessage");
const CopilotAuditLog_1 = require("../../models/CopilotAuditLog");
const roles_1 = require("../../models/roles");
const registry_1 = __importDefault(require("./tools/registry"));
// Trigger tool definitions registration
require("./tools/definitions");
class CopilotService {
    aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1/ai';
    /**
     * Main agent loop running SSE stream lookups
     */
    async handleChatStream(userId, userRole, message, conversationId, confirmedAction, onEvent) {
        try {
            // 1. Resolve or Create Conversation
            let conversation;
            if (conversationId) {
                conversation = await CopilotConversation_1.CopilotConversation.findOne({ _id: conversationId, userId, isActive: true });
                if (!conversation) {
                    throw new Error('Conversation not found or has been archived.');
                }
            }
            else {
                const sessionId = new mongoose_1.default.Types.ObjectId().toString();
                const shortTitle = message.length > 40 ? `${message.substring(0, 40)}...` : message;
                conversation = await CopilotConversation_1.CopilotConversation.create({
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    title: shortTitle,
                    sessionId,
                    isActive: true
                });
            }
            const currentConvId = conversation._id.toString();
            // Verify user has a valid role
            if (!userRole) {
                const errMsg = 'Access Denied: Invalid user role.';
                onEvent?.({ type: 'token', content: errMsg });
                onEvent?.({ type: 'done', conversationId: currentConvId, suggestedFollowUps: [] });
                return;
            }
            // 2. Fetch history from DB
            const dbMessages = await CopilotMessage_1.CopilotMessage.find({ conversationId: conversation._id }).sort({ timestamp: 1 });
            const messagesHistory = [];
            // Add system prompt first
            const systemPrompt = this.buildSystemPrompt(userRole);
            messagesHistory.push({ role: 'system', content: systemPrompt });
            // Append DB history mapped to OpenRouter formats
            dbMessages.forEach((msg) => {
                const item = { role: msg.role, content: msg.content };
                if (msg.name)
                    item.name = msg.name;
                if (msg.toolCalls)
                    item.tool_calls = msg.toolCalls;
                messagesHistory.push(item);
            });
            const auditToolsUsed = [];
            // 3. Handle confirmed write actions (Human-in-the-Loop)
            if (confirmedAction) {
                onEvent?.({ type: 'status', content: `Executing approved action: ${confirmedAction.tool}...` });
                const startTime = Date.now();
                const toolResult = await registry_1.default.execute(confirmedAction.tool, confirmedAction.args, { _id: userId, role: userRole });
                const duration = Date.now() - startTime;
                auditToolsUsed.push({
                    name: confirmedAction.tool,
                    arguments: confirmedAction.args,
                    durationMs: duration,
                    status: toolResult.error ? 'FAILED' : 'SUCCESS'
                });
                // Save LLM assistant mock requesting the tool call
                const mockToolCallId = `call_${Date.now()}`;
                const assistantToolReq = await CopilotMessage_1.CopilotMessage.create({
                    conversationId: conversation._id,
                    role: 'assistant',
                    content: `Confirming action execution for ${confirmedAction.tool}...`,
                    toolCalls: [{
                            id: mockToolCallId,
                            type: 'function',
                            function: {
                                name: confirmedAction.tool,
                                arguments: JSON.stringify(confirmedAction.args)
                            }
                        }]
                });
                // Save tool response
                const toolRespMsg = await CopilotMessage_1.CopilotMessage.create({
                    conversationId: conversation._id,
                    role: 'tool',
                    name: confirmedAction.tool,
                    content: JSON.stringify(toolResult),
                    toolCalls: undefined // Tool messages don't have toolCalls
                });
                messagesHistory.push({
                    role: 'assistant',
                    content: assistantToolReq.content,
                    tool_calls: assistantToolReq.toolCalls
                });
                messagesHistory.push({
                    role: 'tool',
                    name: toolRespMsg.name,
                    content: toolRespMsg.content
                });
            }
            else {
                // Normal text prompt: Save and push user query
                await CopilotMessage_1.CopilotMessage.create({
                    conversationId: conversation._id,
                    role: 'user',
                    content: message
                });
                messagesHistory.push({ role: 'user', content: message });
            }
            // 4. Expose dynamic tool schemas matching role
            const tools = registry_1.default.getToolsForRole(userRole);
            // 5. Agent loop to execute tools and obtain completion
            let loopCount = 0;
            const maxLoops = 5;
            let finalResponseText = '';
            let isCompleted = false;
            while (loopCount < maxLoops && !isCompleted) {
                loopCount++;
                onEvent?.({ type: 'status', content: 'Connecting to AI Assistant...' });
                const fastapiResponse = await fetch(`${this.aiServiceUrl}/chat/stream`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messagesHistory, tools })
                });
                if (!fastapiResponse.ok) {
                    const errText = await fastapiResponse.text();
                    throw new Error(`AI Service stream error: ${fastapiResponse.status} - ${errText}`);
                }
                const reader = fastapiResponse.body?.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let activeToolCalls = [];
                let activeText = '';
                if (!reader)
                    throw new Error('Could not read stream body.');
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed.startsWith('data: '))
                            continue;
                        const rawJson = trimmed.substring(6);
                        if (rawJson === '[DONE]')
                            continue;
                        try {
                            const data = JSON.parse(rawJson);
                            const choice = data.choices?.[0];
                            if (!choice)
                                continue;
                            const delta = choice.delta;
                            // Parse Tool Calls Stream Chunks
                            if (delta?.tool_calls) {
                                delta.tool_calls.forEach((tc) => {
                                    const idx = tc.index;
                                    if (!activeToolCalls[idx]) {
                                        activeToolCalls[idx] = {
                                            id: tc.id || '',
                                            type: 'function',
                                            function: { name: tc.function?.name || '', arguments: tc.function?.arguments || '' }
                                        };
                                    }
                                    else {
                                        if (tc.id)
                                            activeToolCalls[idx].id = tc.id;
                                        if (tc.function?.name)
                                            activeToolCalls[idx].function.name = tc.function.name;
                                        if (tc.function?.arguments)
                                            activeToolCalls[idx].function.arguments += tc.function.arguments;
                                    }
                                });
                            }
                            // Parse Text Tokens Stream Chunks
                            if (delta?.content) {
                                activeText += delta.content;
                                onEvent?.({ type: 'token', content: delta.content });
                            }
                        }
                        catch (err) {
                            // Ignore partial chunk parse issues
                        }
                    }
                }
                // Check if tools were requested
                const filteredToolCalls = activeToolCalls.filter(Boolean);
                if (filteredToolCalls.length > 0) {
                    // LLM wants to call a tool
                    let hasPendingApproval = false;
                    for (const toolCall of filteredToolCalls) {
                        const toolName = toolCall.function.name;
                        let toolArgs = {};
                        try {
                            toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                        }
                        catch (e) {
                            toolArgs = {};
                        }
                        const toolDef = registry_1.default.getTool(toolName);
                        // Intercept Write Actions to require confirmation (Human-in-the-Loop)
                        if (toolDef?.isWrite && !confirmedAction) {
                            hasPendingApproval = true;
                            onEvent?.({
                                type: 'approval_required',
                                content: {
                                    tool: toolName,
                                    args: toolArgs,
                                    description: toolDef.description
                                }
                            });
                            // Save the assistant request pointing to approval
                            await CopilotMessage_1.CopilotMessage.create({
                                conversationId: conversation._id,
                                role: 'assistant',
                                content: `Action confirmation needed for: ${toolName}.`,
                                toolCalls: filteredToolCalls
                            });
                            break;
                        }
                    }
                    if (hasPendingApproval) {
                        // Stop loop, wait for user confirm/cancel input
                        return;
                    }
                    // Execute read-only tools or confirmed write tools
                    const toolResultsToFeed = [];
                    for (const toolCall of filteredToolCalls) {
                        const toolName = toolCall.function.name;
                        let toolArgs = {};
                        try {
                            toolArgs = JSON.parse(toolCall.function.arguments || '{}');
                        }
                        catch (e) {
                            toolArgs = {};
                        }
                        onEvent?.({ type: 'status', content: `Running database search: ${toolName}...` });
                        const startTime = Date.now();
                        const toolResult = await registry_1.default.execute(toolName, toolArgs, { _id: userId, role: userRole });
                        const duration = Date.now() - startTime;
                        auditToolsUsed.push({
                            name: toolName,
                            arguments: toolArgs,
                            durationMs: duration,
                            status: toolResult.error ? 'FAILED' : 'SUCCESS'
                        });
                        toolResultsToFeed.push({
                            role: 'tool',
                            name: toolName,
                            content: JSON.stringify(toolResult),
                            toolCalls: undefined // Ensure tool calls are not on the tool output message
                        });
                        // Save tool message logs to DB
                        await CopilotMessage_1.CopilotMessage.create({
                            conversationId: conversation._id,
                            role: 'tool',
                            name: toolName,
                            content: JSON.stringify(toolResult)
                        });
                    }
                    // Save assistant calls to DB
                    await CopilotMessage_1.CopilotMessage.create({
                        conversationId: conversation._id,
                        role: 'assistant',
                        content: `Invoking tools: ${filteredToolCalls.map(t => t.function.name).join(', ')}`,
                        toolCalls: filteredToolCalls
                    });
                    // Push to history and query OpenRouter again
                    messagesHistory.push({
                        role: 'assistant',
                        content: `Invoking tools: ${filteredToolCalls.map(t => t.function.name).join(', ')}`,
                        tool_calls: filteredToolCalls
                    });
                    toolResultsToFeed.forEach((tr) => {
                        messagesHistory.push({
                            role: 'tool',
                            name: tr.name,
                            content: tr.content
                        });
                    });
                }
                else {
                    // Text generated successfully
                    finalResponseText = activeText;
                    isCompleted = true;
                }
            }
            // 6. Extract suggested follow-ups
            let cleanedText = finalResponseText;
            let suggestedFollowUps = [];
            const followUpIndex = finalResponseText.indexOf('[FOLLOW_UP]:');
            if (followUpIndex !== -1) {
                cleanedText = finalResponseText.substring(0, followUpIndex).trim();
                const followUpRaw = finalResponseText.substring(followUpIndex + 12).trim();
                try {
                    suggestedFollowUps = JSON.parse(followUpRaw);
                }
                catch (e) {
                    // Attempt backup regex parsing if model messed up JSON quotes
                    const match = followUpRaw.match(/\[(.*?)\]/);
                    if (match && match[1]) {
                        suggestedFollowUps = match[1].split(',').map(s => s.replace(/"/g, '').trim());
                    }
                }
            }
            // Default fallback followups if LLM forgot to output them
            if (suggestedFollowUps.length === 0) {
                suggestedFollowUps = ['View top candidates', 'Summarize recruitment funnel', 'Check active employees'];
            }
            // Save final assistant response to DB
            await CopilotMessage_1.CopilotMessage.create({
                conversationId: conversation._id,
                role: 'assistant',
                content: cleanedText
            });
            // Save security compliance audit log
            await CopilotAuditLog_1.CopilotAuditLog.create({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                prompt: message,
                toolsUsed: auditToolsUsed,
                response: cleanedText
            });
            onEvent?.({
                type: 'done',
                conversationId: currentConvId,
                suggestedFollowUps: suggestedFollowUps.slice(0, 3) // Return top 3 follow-ups
            });
        }
        catch (error) {
            console.error('[Copilot Service Error]:', error);
            onEvent?.({ type: 'error', content: `Copilot Error: ${error.message || error}` });
        }
    }
    /**
     * System Prompt detailing boundaries, instructions, and follow-ups format
     */
    buildSystemPrompt(userRole) {
        const isEmployee = userRole === roles_1.SystemRoles.EMPLOYEE;
        if (isEmployee) {
            return `You are HR Copilot, an employee self-service knowledge assistant for the HRMinds AI platform.
Your primary role is to answer questions about company policies, guidelines, onboarding, leave rules, reimbursements, and employee handbooks.

CRITICAL INSTRUCTIONS:
1. ALWAYS retrieve real policy data using appropriate search tools (e.g. searchKnowledgeBase, summarizePolicy) before answering. Never invent guidelines.
2. If the policy cannot be found in the documents, state clearly: "I could not find information regarding this topic in the uploaded company documentation. Please contact HR."
3. Every response must include precise source citations, including document names and page numbers or sections.
4. Do not discuss internal recruitment, screening scores of other employees, or executive analytics. You do not have access to these datasets.

SUGGESTED FOLLOW-UPS:
At the very end of your response, you MUST output 2 or 3 contextual follow-up questions in this exact format:
[FOLLOW_UP]: ["Read leave policy", "Check probation guidelines"]`;
        }
        return `You are HR Copilot, an enterprise AI assistant for the HRMinds AI platform.
You have access to a rich set of database tools querying employee records, recruitment details, AI screening, executive analytics, and the company knowledge base.

CRITICAL INSTRUCTIONS:
1. ALWAYS retrieve real platform data using appropriate tools before answering. Never invent statistics or guidelines.
2. If data or policy context is empty, report it truthfully. Do not assume or hallucinate.
3. Be professional, concise, and helpful. Format your responses in markdown (tables, lists, bold keywords).
4. Respect User Roles. For policy questions, perform a search in the knowledge base and provide clear source citations.
5. If the user prompts to perform a write action (e.g. creating a job post) and you are missing required fields, ask the user to provide them (e.g., Title, Department name, Experience) before invoking the action tool.

SUGGESTED FOLLOW-UPS:
At the very end of your response, you MUST output 2 or 3 contextual follow-up questions/actions in this exact format:
[FOLLOW_UP]: ["Follow-up Prompt 1", "Follow-up Prompt 2"]
For example, if the user asks for open jobs, suggest:
[FOLLOW_UP]: ["View top candidates for Senior QA Engineer", "Generate weekly recruitment report"]
This follow-up block will be parsed by the client. Always output it at the very bottom.`;
    }
}
exports.CopilotService = CopilotService;
exports.default = new CopilotService();
