"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolRegistry = void 0;
class ToolRegistry {
    tools = new Map();
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    /**
     * Returns openapi-compatible function specifications filtered by user role
     */
    getToolsForRole(role) {
        const list = [];
        for (const tool of this.tools.values()) {
            if (tool.roles.includes(role)) {
                list.push({
                    type: 'function',
                    function: {
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters
                    }
                });
            }
        }
        return list;
    }
    getTool(name) {
        return this.tools.get(name);
    }
    /**
     * Execute a tool check with RBAC and error catching
     */
    async execute(name, args, user) {
        const tool = this.tools.get(name);
        if (!tool) {
            return { error: `Tool '${name}' not found in registry.` };
        }
        if (!tool.roles.includes(user.role)) {
            return { error: `Unauthorized: Tool '${name}' is not available for role: ${user.role}` };
        }
        try {
            return await tool.handler(args, user);
        }
        catch (err) {
            console.error(`[Tool Execution Error] ${name}:`, err);
            return { error: `Execution error: ${err.message || err}` };
        }
    }
}
exports.ToolRegistry = ToolRegistry;
exports.default = new ToolRegistry();
