export interface KnowledgeProvider {
  name: string;
  query(target: any, filter?: any, limit?: number): Promise<any>;
}
