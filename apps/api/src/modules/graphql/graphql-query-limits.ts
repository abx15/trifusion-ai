import {
  FragmentDefinitionNode,
  GraphQLError,
  ValidationRule,
} from 'graphql';

export interface GraphQLQueryLimits {
  maxDepth: number;
  maxComplexity: number;
}

export function createGraphQLQueryLimits(
  limits: GraphQLQueryLimits,
): ValidationRule {
  return (context) => {
    const fragments = new Map<string, FragmentDefinitionNode>();
    for (const definition of context.getDocument().definitions) {
      if (definition.kind === 'FragmentDefinition') {
        fragments.set(definition.name.value, definition);
      }
    }

    return {
      OperationDefinition: {
        enter(operation) {
          let complexity = 0;
          let depthReported = false;
          let complexityReported = false;

          const visitSelectionSet = (
            selectionSet: typeof operation.selectionSet,
            depth: number,
            fragmentPath: Set<string>,
          ) => {
            for (const selection of selectionSet.selections) {
              if (selection.kind === 'Field') {
                const fieldDepth = depth + 1;
                complexity += 1;
                if (fieldDepth > limits.maxDepth && !depthReported) {
                  depthReported = true;
                  context.reportError(
                    new GraphQLError(
                      `Query depth exceeds the maximum of ${limits.maxDepth}`,
                      { nodes: selection },
                    ),
                  );
                }
                if (complexity > limits.maxComplexity && !complexityReported) {
                  complexityReported = true;
                  context.reportError(
                    new GraphQLError(
                      `Query complexity exceeds the maximum of ${limits.maxComplexity}`,
                      { nodes: selection },
                    ),
                  );
                }
                if (selection.selectionSet) {
                  visitSelectionSet(selection.selectionSet, fieldDepth, fragmentPath);
                }
              } else if (selection.kind === 'InlineFragment') {
                visitSelectionSet(selection.selectionSet, depth, fragmentPath);
              } else {
                const fragmentName = selection.name.value;
                const fragment = fragments.get(fragmentName);
                if (fragment && !fragmentPath.has(fragmentName)) {
                  const nextFragmentPath = new Set(fragmentPath);
                  nextFragmentPath.add(fragmentName);
                  visitSelectionSet(fragment.selectionSet, depth, nextFragmentPath);
                }
              }
            }
          };

          visitSelectionSet(operation.selectionSet, 0, new Set());
        },
      },
    };
  };
}
