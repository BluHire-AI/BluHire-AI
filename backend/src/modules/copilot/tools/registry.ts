export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, user: any) => Promise<any>;
  roles: string[];
  isWrite: boolean;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Returns openapi-compatible function specifications filtered by user role
   */
  getToolsForRole(role: string): any[] {
    const list: any[] = [];
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

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool check with RBAC and error catching
   */
  async execute(name: string, args: any, user: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { error: `Tool '${name}' not found in registry.` };
    }

    if (!tool.roles.includes(user.role)) {
      return { error: `Unauthorized: Tool '${name}' is not available for role: ${user.role}` };
    }

    try {
      return await tool.handler(args, user);
    } catch (err: any) {
      console.error(`[Tool Execution Error] ${name}:`, err);
      return { error: `Execution error: ${err.message || err}` };
    }
  }
}

export default new ToolRegistry();
