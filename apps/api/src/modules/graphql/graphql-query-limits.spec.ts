import { buildSchema, parse, specifiedRules, validate } from 'graphql';
import { createGraphQLQueryLimits } from './graphql-query-limits';

describe('GraphQL query limits', () => {
  const schema = buildSchema(`
    type Query {
      item: Item
      items: [Item!]!
    }

    type Item {
      child: Item
      name: String!
    }
  `);

  it('rejects queries deeper than the configured maximum', () => {
    const errors = validate(
      schema,
      parse('{ item { child { name } } }'),
      [...specifiedRules, createGraphQLQueryLimits({ maxDepth: 2, maxComplexity: 100 })],
    );

    expect(errors.map(({ message }) => message)).toContain(
      'Query depth exceeds the maximum of 2',
    );
  });

  it('counts fields expanded from fragments toward the depth limit', () => {
    const errors = validate(
      schema,
      parse(`
        query {
          item {
            ...NestedItem
          }
        }
        fragment NestedItem on Item {
          child {
            name
          }
        }
      `),
      [...specifiedRules, createGraphQLQueryLimits({ maxDepth: 2, maxComplexity: 100 })],
    );

    expect(errors.map(({ message }) => message)).toContain(
      'Query depth exceeds the maximum of 2',
    );
  });

  it('rejects queries exceeding the configured field complexity', () => {
    const errors = validate(
      schema,
      parse('{ item { name } items { name } }'),
      [...specifiedRules, createGraphQLQueryLimits({ maxDepth: 5, maxComplexity: 3 })],
    );

    expect(errors.map(({ message }) => message)).toContain(
      'Query complexity exceeds the maximum of 3',
    );
  });
});
