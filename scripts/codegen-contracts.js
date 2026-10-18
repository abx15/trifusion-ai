// Codegen script for shared contracts
// Reads GraphQL schema and generates TypeScript types for the frontend
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(process.cwd(), 'apps/api/src/modules/graphql/schema.gql');
const outputPath = path.join(process.cwd(), 'packages/contracts/src/generated/graphql-types.ts');

if (!fs.existsSync(schemaPath)) {
  console.log('GraphQL schema not found. Run `pnpm --filter @trifusion/api build` first to generate it.');
  process.exit(0);
}

const schema = fs.readFileSync(schemaPath, 'utf-8');

// Simple extraction of type definitions from GraphQL SDL
const typeMatches = schema.matchAll(/type (\w+) \{([^}]+)\}/g);
const types = [];

for (const match of typeMatches) {
  const typeName = match[1];
  const fieldsBlock = match[2];
  const fieldLines = fieldsBlock.trim().split('\n').filter(line => line.trim());
  const fields = {};

  for (const line of fieldLines) {
    const fieldMatch = line.trim().match(/(\w+)(!?):\s*([^\s]+)/);
    if (fieldMatch) {
      const fieldName = fieldMatch[1];
      const isRequired = fieldMatch[2] === '!';
      let fieldType = fieldMatch[3].replace(/[\[\]!]/g, '');
      let isList = fieldMatch[3].includes('[');

      // Map GraphQL types to TypeScript
      let tsType = 'any';
      switch (fieldType) {
        case 'String': tsType = 'string'; break;
        case 'Int': tsType = 'number'; break;
        case 'Float': tsType = 'number'; break;
        case 'Boolean': tsType = 'boolean'; break;
        case 'ID': tsType = 'string'; break;
        case 'DateTime': tsType = 'string'; break;
        default: tsType = fieldType; break;
      }

      if (isList) tsType = `${tsType}[]`;
      if (!isRequired) tsType = `${tsType} | null`;

      fields[fieldName] = tsType;
    }
  }

  types.push({ name: typeName, fields });
}

let output = '// Auto-generated from GraphQL schema - DO NOT EDIT MANUALLY\n\n';
for (const type of types) {
  output += `export interface ${type.name} {\n`;
  for (const [fieldName, fieldType] of Object.entries(type.fields)) {
    output += `  ${fieldName}: ${fieldType};\n`;
  }
  output += '}\n\n';
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, output);
console.log(`Generated ${types.length} GraphQL types to ${outputPath}`);
