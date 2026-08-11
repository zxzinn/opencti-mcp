#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { renderResult } from './gcf-format.js';
import {
  LATEST_REPORTS_QUERY,
  SEARCH_MALWARE_QUERY,
  SEARCH_INDICATORS_QUERY,
  SEARCH_THREAT_ACTORS_QUERY,
} from './queries/reports.js';
import {
  USER_BY_ID_QUERY,
  ALL_USERS_QUERY,
  ALL_GROUPS_QUERY,
  ALL_ROLES_QUERY,
  ALL_CAPABILITIES_QUERY,
} from './queries/users.js';
import {
  REPORT_BY_ID_QUERY,
  ALL_ATTACK_PATTERNS_QUERY,
  CAMPAIGN_BY_NAME_QUERY,
  ALL_STIX_CORE_OBJECTS_QUERY,
  ALL_STIX_DOMAIN_OBJECTS_QUERY,
} from './queries/stix_objects.js';
import {
  ALL_STIX_CORE_RELATIONSHIPS_QUERY,
  ALL_STIX_SIGHTING_RELATIONSHIPS_QUERY,
  ALL_STIX_REF_RELATIONSHIPS_QUERY,
  ALL_STIX_RELATIONSHIPS_QUERY,
} from './queries/relationships.js';
import {
  ALL_CONNECTORS_QUERY,
  ALL_STATUS_TEMPLATES_QUERY,
  ALL_STATUSES_QUERY,
  ALL_SUB_TYPES_QUERY,
  ALL_RETENTION_RULES_QUERY,
  ALL_BACKGROUND_TASKS_QUERY,
  ALL_FEEDS_QUERY,
  ALL_TAXII_COLLECTIONS_QUERY,
  ALL_STREAM_COLLECTIONS_QUERY,
  ALL_RULES_QUERY,
  ALL_SYNCHRONIZERS_QUERY,
} from './queries/system.js';
import {
  FILE_BY_ID_QUERY,
  ALL_FILES_QUERY,
  ALL_INDEXED_FILES_QUERY,
  ALL_LOGS_QUERY,
  ALL_AUDITS_QUERY,
  ALL_ATTRIBUTES_QUERY,
  ALL_SCHEMA_ATTRIBUTE_NAMES_QUERY,
  ALL_FILTER_KEYS_SCHEMA_QUERY,
} from './queries/metadata.js';
import {
  ALL_MARKING_DEFINITIONS_QUERY,
  ALL_LABELS_QUERY,
  ALL_EXTERNAL_REFERENCES_QUERY,
  ALL_KILL_CHAIN_PHASES_QUERY,
} from './queries/references.js';

const OPENCTI_URL = process.env.OPENCTI_URL || 'http://localhost:8080';
const OPENCTI_TOKEN = process.env.OPENCTI_TOKEN;

if (!OPENCTI_TOKEN) {
  throw new Error('OPENCTI_TOKEN environment variable is required');
}

interface OpenCTIResponse {
  data: {
    stixObjects: Array<{
      id: string;
      name?: string;
      description?: string;
      created_at?: string;
      modified_at?: string;
      pattern?: string;
      valid_from?: string;
      valid_until?: string;
      x_opencti_score?: number;
      [key: string]: any;
    }>;
  };
}

class OpenCTIServer {
  private server: Server;
  private axiosInstance;

  constructor() {
    this.server = new Server(
      {
        name: 'opencti-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.axiosInstance = axios.create({
      baseURL: OPENCTI_URL,
      headers: {
        'Authorization': `Bearer ${OPENCTI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    this.setupTools();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Reports
        {
          name: 'get_latest_reports',
          description: '獲取最新的OpenCTI報告',
          inputSchema: {
            type: 'object',
            properties: {
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
          },
        },
        {
          name: 'get_report_by_id',
          description: '根據ID獲取OpenCTI報告',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '報告ID',
              },
            },
            required: ['id'],
          },
        },
        // Search
        {
          name: 'search_indicators',
          description: '搜尋OpenCTI中的指標',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜尋關鍵字',
              },
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_malware',
          description: '搜尋OpenCTI中的惡意程式',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜尋關鍵字',
              },
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'search_threat_actors',
          description: '搜尋OpenCTI中的威脅行為者',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: '搜尋關鍵字',
              },
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
            required: ['query'],
          },
        },
        // Users & Groups
        {
          name: 'get_user_by_id',
          description: '根據ID獲取使用者資訊',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '使用者ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_users',
          description: '列出所有使用者',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_groups',
          description: '列出所有群組',
          inputSchema: {
            type: 'object',
            properties: {
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
          },
        },
        // STIX Objects
        {
          name: 'list_attack_patterns',
          description: '列出所有攻擊模式',
          inputSchema: {
            type: 'object',
            properties: {
              first: {
                type: 'number',
                description: '返回結果數量限制',
                default: 10,
              },
            },
          },
        },
        {
          name: 'get_campaign_by_name',
          description: '根據名稱獲取行動資訊',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '行動名稱',
              },
            },
            required: ['name'],
          },
        },
        // System
        {
          name: 'list_connectors',
          description: '列出所有連接器',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_status_templates',
          description: '列出所有狀態模板',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // Files
        {
          name: 'get_file_by_id',
          description: '根據ID獲取檔案資訊',
          inputSchema: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                description: '檔案ID',
              },
            },
            required: ['id'],
          },
        },
        {
          name: 'list_files',
          description: '列出所有檔案',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        // References
        {
          name: 'list_marking_definitions',
          description: '列出所有標記定義',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'list_labels',
          description: '列出所有標籤',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        let query = '';
        let variables: any = {};

        switch (request.params.name) {
          // Reports
          case 'get_latest_reports':
            query = LATEST_REPORTS_QUERY;
            variables = {
              first: typeof request.params.arguments?.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          case 'get_report_by_id':
            if (!request.params.arguments?.id) {
              throw new McpError(ErrorCode.InvalidParams, 'Report ID is required');
            }
            query = REPORT_BY_ID_QUERY;
            variables = { id: request.params.arguments.id };
            break;

          // Search
          case 'search_indicators':
            if (!request.params.arguments?.query) {
              throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');
            }
            query = SEARCH_INDICATORS_QUERY;
            variables = {
              search: request.params.arguments.query,
              first: typeof request.params.arguments.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          case 'search_malware':
            if (!request.params.arguments?.query) {
              throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');
            }
            query = SEARCH_MALWARE_QUERY;
            variables = {
              search: request.params.arguments.query,
              first: typeof request.params.arguments.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          case 'search_threat_actors':
            if (!request.params.arguments?.query) {
              throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required');
            }
            query = SEARCH_THREAT_ACTORS_QUERY;
            variables = {
              search: request.params.arguments.query,
              first: typeof request.params.arguments.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          // Users & Groups
          case 'get_user_by_id':
            if (!request.params.arguments?.id) {
              throw new McpError(ErrorCode.InvalidParams, 'User ID is required');
            }
            query = USER_BY_ID_QUERY;
            variables = { id: request.params.arguments.id };
            break;

          case 'list_users':
            query = ALL_USERS_QUERY;
            break;

          case 'list_groups':
            query = ALL_GROUPS_QUERY;
            variables = {
              first: typeof request.params.arguments?.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          // STIX Objects
          case 'list_attack_patterns':
            query = ALL_ATTACK_PATTERNS_QUERY;
            variables = {
              first: typeof request.params.arguments?.first === 'number' ? request.params.arguments.first : 10,
            };
            break;

          case 'get_campaign_by_name':
            if (!request.params.arguments?.name) {
              throw new McpError(ErrorCode.InvalidParams, 'Campaign name is required');
            }
            query = CAMPAIGN_BY_NAME_QUERY;
            variables = { name: request.params.arguments.name };
            break;

          // System
          case 'list_connectors':
            query = ALL_CONNECTORS_QUERY;
            break;

          case 'list_status_templates':
            query = ALL_STATUS_TEMPLATES_QUERY;
            break;

          // Files
          case 'get_file_by_id':
            if (!request.params.arguments?.id) {
              throw new McpError(ErrorCode.InvalidParams, 'File ID is required');
            }
            query = FILE_BY_ID_QUERY;
            variables = { id: request.params.arguments.id };
            break;

          case 'list_files':
            query = ALL_FILES_QUERY;
            break;

          // References
          case 'list_marking_definitions':
            query = ALL_MARKING_DEFINITIONS_QUERY;
            break;

          case 'list_labels':
            query = ALL_LABELS_QUERY;
            break;

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }

        const response = await this.axiosInstance.post('/graphql', {
          query,
          variables,
        });

        console.error('OpenCTI Response:', JSON.stringify(response.data, null, 2));
        
        if (!response.data?.data) {
          throw new McpError(
            ErrorCode.InternalError,
            `Invalid response format from OpenCTI: ${JSON.stringify(response.data)}`
          );
        }

        let formattedResponse;
        
        switch (request.params.name) {
          case 'get_latest_reports':
            formattedResponse = response.data.data.reports.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              description: edge.node.description || '',
              content: edge.node.content || '',
              published: edge.node.published,
              confidence: edge.node.confidence,
              created: edge.node.created,
              modified: edge.node.modified,
              reportTypes: edge.node.report_types || [],
            }));
            break;

          case 'get_report_by_id':
            formattedResponse = {
              ...response.data.data.report,
              name: response.data.data.report.name || 'Unnamed',
              description: response.data.data.report.description || '',
            };
            break;

          case 'search_indicators':
          case 'search_malware':
          case 'search_threat_actors':
            formattedResponse = response.data.data.stixCoreObjects.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              description: edge.node.description || '',
              created: edge.node.created,
              modified: edge.node.modified,
              type: edge.node.malware_types?.join(', ') || edge.node.threat_actor_types?.join(', ') || '',
              family: edge.node.is_family ? 'Yes' : 'No',
              firstSeen: edge.node.first_seen || '',
              lastSeen: edge.node.last_seen || '',
              pattern: edge.node.pattern || '',
              validFrom: edge.node.valid_from || '',
              validUntil: edge.node.valid_until || '',
              score: edge.node.x_opencti_score,
            }));
            break;

          case 'get_user_by_id':
            formattedResponse = {
              ...response.data.data.user,
              name: response.data.data.user.name || 'Unnamed',
            };
            break;

          case 'list_users':
            formattedResponse = response.data.data.users.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              email: edge.node.user_email,
              firstname: edge.node.firstname,
              lastname: edge.node.lastname,
              created: edge.node.created_at,
              modified: edge.node.updated_at,
            }));
            break;

          case 'list_groups':
            formattedResponse = response.data.data.groups.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              description: edge.node.description || '',
              members: edge.node.members?.edges?.map((memberEdge: any) => ({
                id: memberEdge.node.id,
                name: memberEdge.node.name,
                email: memberEdge.node.user_email,
              })) || [],
            }));
            break;

          case 'list_attack_patterns':
            formattedResponse = response.data.data.attackPatterns.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              description: edge.node.description || '',
              created: edge.node.created_at,
              modified: edge.node.updated_at,
              killChainPhases: edge.node.killChainPhases?.edges?.map((phaseEdge: any) => ({
                id: phaseEdge.node.id,
                name: phaseEdge.node.phase_name,
              })) || [],
            }));
            break;

          case 'list_connectors':
            formattedResponse = response.data.data.connectors.map((connector: any) => ({
              id: connector.id,
              name: connector.name || 'Unnamed',
              type: connector.connector_type,
              scope: connector.connector_scope,
              state: connector.connector_state,
              active: connector.active,
              updated: connector.updated_at,
              created: connector.created_at,
            }));
            break;

          case 'list_status_templates':
            formattedResponse = response.data.data.statusTemplates.edges.map((edge: any) => ({
              id: edge.node.id,
              name: edge.node.name || 'Unnamed',
              color: edge.node.color,
              usages: edge.node.usages,
            }));
            break;

          case 'list_marking_definitions':
            formattedResponse = response.data.data.markingDefinitions.edges.map((edge: any) => ({
              id: edge.node.id,
              definition: edge.node.definition,
              color: edge.node.x_opencti_color,
              order: edge.node.x_opencti_order,
            }));
            break;

          case 'list_labels':
            formattedResponse = response.data.data.labels.edges.map((edge: any) => ({
              id: edge.node.id,
              value: edge.node.value,
              color: edge.node.color,
            }));
            break;

          default:
            formattedResponse = response.data.data;
        }

        return {
          content: [{
            type: 'text',
            text: renderResult(formattedResponse)
          }]
        };
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios Error:', error.response?.data);
          return {
            content: [{
              type: 'text',
              text: `OpenCTI API error: ${JSON.stringify(error.response?.data) || error.message}`
            }],
            isError: true,
          };
        }
        throw error;
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('OpenCTI MCP server running on stdio');
  }
}

const server = new OpenCTIServer();
server.run().catch(console.error);
