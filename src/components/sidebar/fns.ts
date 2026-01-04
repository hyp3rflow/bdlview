import type { Def, BdlIr } from "../../types/bdl";

// ============================================================================
// Types
// ============================================================================

export interface NamespaceNode {
  name: string;
  fullPath: string;
  children: Map<string, NamespaceNode>;
  defs: Array<{ path: string; def: Def; name: string }>;
}

// ============================================================================
// Exported Functions
// ============================================================================

export const createNamespaceTree = (ir: BdlIr): NamespaceNode => {
  const root: NamespaceNode = {
    name: "",
    fullPath: "",
    children: new Map(),
    defs: [],
  };

  for (const [defPath, def] of Object.entries(ir.defs)) {
    const parts = defPath.split(".");
    const defName = parts.pop()!;
    const namespaceParts = parts;

    let current = root;
    let currentPath = "";

    for (const part of namespaceParts) {
      currentPath = currentPath ? `${currentPath}.${part}` : part;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          fullPath: currentPath,
          children: new Map(),
          defs: [],
        });
      }
      current = current.children.get(part)!;
    }

    current.defs.push({ path: defPath, def, name: defName });
  }

  sortDefs(root);
  return root;
};

export const getNodeAtPath = (
  root: NamespaceNode,
  path: string,
): NamespaceNode | null => {
  if (!path) return root;

  const parts = path.split(".");
  let current = root;

  for (const part of parts) {
    const child = current.children.get(part);
    if (!child) return null;
    current = child;
  }

  return current;
};

export const filterNamespaceTree = (
  node: NamespaceNode,
  query: string,
): NamespaceNode | null => {
  const lowerQuery = query.toLowerCase();

  const filteredChildren = new Map<string, NamespaceNode>();
  for (const [key, child] of node.children) {
    const filtered = filterNamespaceTree(child, query);
    if (filtered) {
      filteredChildren.set(key, filtered);
    }
  }

  const filteredDefs = node.defs.filter(
    ({ path, name }) =>
      name.toLowerCase().includes(lowerQuery) ||
      path.toLowerCase().includes(lowerQuery),
  );

  if (filteredChildren.size > 0 || filteredDefs.length > 0) {
    return {
      ...node,
      children: filteredChildren,
      defs: filteredDefs,
    };
  }

  return null;
};

export const getAutoExpandPaths = (node: NamespaceNode): Set<string> => {
  const paths = new Set<string>();

  function traverse(n: NamespaceNode) {
    if (n.children.size === 1 && n.defs.length === 0) {
      const [, child] = Array.from(n.children.entries())[0];
      paths.add(n.fullPath);
      traverse(child);
    } else {
      for (const child of n.children.values()) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return paths;
};

export const getAncestorPaths = (path: string): string[] => {
  if (!path) return [];
  const parts = path.split(".");
  const ancestors: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("."));
  }
  return ancestors;
};

export const isLeafNamespace = (node: NamespaceNode): boolean => {
  return node.defs.length > 0 && node.children.size === 0;
};

// ============================================================================
// Helpers
// ============================================================================

function sortDefs(node: NamespaceNode) {
  // Sort defs: RPC first, then by name
  node.defs.sort((a, b) => {
    const aIsRpc = a.def.type === "Proc";
    const bIsRpc = b.def.type === "Proc";
    if (aIsRpc && !bIsRpc) return -1;
    if (!aIsRpc && bIsRpc) return 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children.values()) {
    sortDefs(child);
  }
}
