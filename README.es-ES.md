# OpenCTI MCP Server

[![smithery badge](https://smithery.ai/badge/opencti-server)](https://smithery.ai/server/opencti-server)
[Traditional Chinese (繁體中文)](README.zh-TW.md)

<a href="https://glama.ai/mcp/servers/ml61kiz1gm"><img width="380" height="200" src="https://glama.ai/mcp/servers/ml61kiz1gm/badge" alt="OpenCTI Server MCP server" /></a>

## Overview
El servidor MCP OpenCTI es un servidor de Protocolo de Modelo de Contexto (MCP) que proporciona una integración fluida con la plataforma OpenCTI (Open Cyber Threat Intelligence). Permite consultar y recuperar datos de inteligencia de amenazas a través de una interfaz estandarizada.

## Features
- Obtener y buscar datos de inteligencia de amenazas
  - Obtener los últimos informes y buscar por ID
  - Buscar información sobre malware
  - Consultar indicadores de compromiso
  - Buscar actores de amenaza
- Gestión de usuarios y grupos
  - Listar todos los usuarios y grupos
  - Obtener detalles de usuarios por ID
- Operaciones de objetos STIX
  - Listar patrones de ataque
  - Obtener información de campañas por nombre
- Gestión del sistema
  - Listar conectores
  - Ver plantillas de estado
- Operaciones de archivos
  - Listar todos los archivos
  - Obtener detalles de archivos por ID
- Acceso a datos de referencia
  - Listar definiciones de marcas
  - Ver etiquetas disponibles
- Límites de consulta personalizables
- Soporte completo para consultas GraphQL

## Prerequisites
- Node.js 16 o superior
- Acceso a una instancia de OpenCTI
- Token de API de OpenCTI

## Installation

### Installing via Smithery

Para instalar OpenCTI Server en Claude Desktop automáticamente a través de [Smithery](https://smithery.ai/server/opencti-server):

```bash
npx -y @smithery/cli install opencti-server --client claude
```

### Manual Installation
```bash
# Clonar el repositorio
git clone https://github.com/yourusername/opencti-mcp-server.git

# Instalar dependencias
cd opencti-mcp-server
npm install

# Construir el proyecto
npm run build
```

## Configuration

### Environment Variables
Copie `.env.example` a `.env` y actualice con sus credenciales de OpenCTI:
```bash
cp .env.example .env
```

Variables de entorno requeridas:
- `OPENCTI_URL`: URL de su instancia de OpenCTI
- `OPENCTI_TOKEN`: Token de API de OpenCTI

### MCP Settings
Cree un archivo de configuración en su ubicación de configuración de MCP:
```json
{
  "mcpServers": {
    "opencti": {
      "command": "node",
      "args": ["path/to/opencti-server/build/index.js"],
      "env": {
        "OPENCTI_URL": "${OPENCTI_URL}",  // Se cargará desde .env
        "OPENCTI_TOKEN": "${OPENCTI_TOKEN}"  // Se cargará desde .env
      }
    }
  }
}
```

### Security Notes
- Nunca comparta el archivo `.env` o tokens de API en el control de versiones
- Mantenga sus credenciales de OpenCTI seguras
- El archivo `.gitignore` está configurado para excluir archivos sensibles

## Available Tools

## Available Tools

### Reports
#### get_latest_reports
Recupera los informes de inteligencia de amenazas más recientes.
```typescript
{
  "name": "get_latest_reports",
  "arguments": {
    "first": 10  // Opcional, por defecto 10
  }
}
```

#### get_report_by_id
Recupera un informe específico por su ID.
```typescript
{
  "name": "get_report_by_id",
  "arguments": {
    "id": "report-uuid"  // Obligatorio
  }
}
```

### Search Operations
#### search_malware
Busca información sobre malware en la base de datos de OpenCTI.
```typescript
{
  "name": "search_malware",
  "arguments": {
    "query": "ransomware",
    "first": 10  // Opcional, por defecto 10
  }
}
```

#### search_indicators
Busca indicadores de compromiso.
```typescript
{
  "name": "search_indicators",
  "arguments": {
    "query": "domain",
    "first": 10  // Opcional, por defecto 10
  }
}
```

#### search_threat_actors
Busca información sobre actores de amenaza.
```typescript
{
  "name": "search_threat_actors",
  "arguments": {
    "query": "APT",
    "first": 10  // Opcional, por defecto 10
  }
}
```

### User Management
#### get_user_by_id
Recupera información de usuarios por ID.
```typescript
{
  "name": "get_user_by_id",
  "arguments": {
    "id": "user-uuid"  // Obligatorio
  }
}
```

#### list_users
Lista todos los usuarios del sistema.
```typescript
{
  "name": "list_users",
  "arguments": {}
}
```

#### list_groups
Lista todos los grupos con sus miembros.
```typescript
{
  "name": "list_groups",
  "arguments": {
    "first": 10  // Opcional, por defecto 10
  }
}
```

### STIX Objects
#### list_attack_patterns
Lista todos los patrones de ataque en el sistema.
```typescript
{
  "name": "list_attack_patterns",
  "arguments": {
    "first": 10  // Opcional, por defecto 10
  }
}
```

#### get_campaign_by_name
Recupera información de campañas por nombre.
```typescript
{
  "name": "get_campaign_by_name",
  "arguments": {
    "name": "campaign-name"  // Obligatorio
  }
}
```

### System Management
#### list_connectors
Lista todos los conectores del sistema.
```typescript
{
  "name": "list_connectors",
  "arguments": {}
}
```

#### list_status_templates
Lista todas las plantillas de estado.
```typescript
{
  "name": "list_status_templates",
  "arguments": {}
}
```

### File Operations
#### get_file_by_id
Recupera información de archivos por ID.
```typescript
{
  "name": "get_file_by_id",
  "arguments": {
    "id": "file-uuid"  // Obligatorio
  }
}
```

#### list_files
Lista todos los archivos del sistema.
```typescript
{
  "name": "list_files",
  "arguments": {}
}
```

### Reference Data
#### list_marking_definitions
Lista todas las definiciones de marcas.
```typescript
{
  "name": "list_marking_definitions",
  "arguments": {}
}
```

#### list_labels
Lista todas las etiquetas disponibles.
```typescript
{
  "name": "list_labels",
  "arguments": {}
}
```

## Contributing
¡Se dan la bienvenida contribuciones! No dude en enviar solicitudes de extracción.

## License
Licencia MIT
