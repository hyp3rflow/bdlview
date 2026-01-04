import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { css } from "../../styled-system/css";
import { serverUrlBunja } from "../state/bdl";
import type { Def, BdlIr } from "../types/bdl";
import { useBunja } from "bunja/react";

interface SidebarProps {
  onSelectDef: (defPath: string) => void;
  onSelectNamespace: (namespacePath: string) => void;
  onSelectFile: (namespacePath: string) => void;
  selectedDefPath: string | null;
  selectedNamespace: string | null;
  selectedFile: string | null;
  expandPath: string | null; // Path to expand and scroll to
  ir: BdlIr | null;
  standards: string[];
  selectedStandard: string | null;
  setSelectedStandard: (standard: string | null) => void;
  isLoading: boolean;
  error: string | null;
  width: number;
  onWidthChange: (width: number) => void;
}

// Check if a namespace is a leaf (has defs but no child namespaces)
const isLeafNamespace = (node: NamespaceNode): boolean => {
  return node.defs.length > 0 && node.children.size === 0;
};

// Short type tags
const getTypeTag = (def: Def): { tag: string; color: string } => {
  switch (def.type) {
    case "Proc":
      return { tag: "rpc", color: "#2563EB" };
    case "Struct":
      return { tag: "s", color: "#7C3AED" };
    case "Enum":
      return { tag: "e", color: "#059669" };
    case "Union":
      return { tag: "u", color: "#EA580C" };
    case "Oneof":
      return { tag: "o", color: "#0891B2" };
    case "Custom":
      return { tag: "t", color: "#78716C" };
  }
};

// Namespace tree node
export interface NamespaceNode {
  name: string;
  fullPath: string;
  children: Map<string, NamespaceNode>;
  defs: Array<{ path: string; def: Def; name: string }>;
}

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

  // Sort defs: RPC first, then by name
  function sortDefs(node: NamespaceNode) {
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

const filterNamespaceTree = (
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

// Collect all paths that should auto-expand (single child chains)
const getAutoExpandPaths = (node: NamespaceNode): Set<string> => {
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

// Get all ancestor paths for a given path
const getAncestorPaths = (path: string): string[] => {
  if (!path) return [];
  const parts = path.split(".");
  const ancestors: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("."));
  }
  return ancestors;
};

// Folder icons
const FolderClosedIcon = () => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={css({ flexShrink: 0 })}
    >
      <path
        d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
        fill="#D4A574"
        stroke="#B8956E"
        strokeWidth="1"
      />
    </svg>
  );
};

const FolderOpenIcon = () => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={css({ flexShrink: 0 })}
    >
      <path
        d="M5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
        fill="#E8C89A"
        stroke="#B8956E"
        strokeWidth="1"
      />
      <path d="M3 10H21" stroke="#B8956E" strokeWidth="1" />
    </svg>
  );
};

interface NamespaceTreeViewProps {
  node: NamespaceNode;
  level: number;
  expandedNamespaces: Set<string>;
  autoExpandPaths: Set<string>;
  toggleNamespace: (path: string) => void;
  onSelectDef: (defPath: string) => void;
  onSelectNamespace: (namespacePath: string) => void;
  onSelectFile: (namespacePath: string) => void;
  selectedDefPath: string | null;
  selectedNamespace: string | null;
  selectedFile: string | null;
}

const FileIcon = () => {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={css({ flexShrink: 0 })}
    >
      <path
        d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
        fill="#E8E4DE"
        stroke="#A8A29E"
        strokeWidth="1"
      />
      <path d="M14 2V8H20" stroke="#A8A29E" strokeWidth="1" />
    </svg>
  );
};

const NamespaceTreeView = ({
  node,
  level,
  expandedNamespaces,
  autoExpandPaths,
  toggleNamespace,
  onSelectDef,
  onSelectNamespace,
  onSelectFile,
  selectedDefPath,
  selectedNamespace,
  selectedFile,
}: NamespaceTreeViewProps) => {
  const hasContent = node.defs.length > 0 || node.children.size > 0;
  if (!hasContent) return null;

  const isLeaf = isLeafNamespace(node);
  const isAutoExpanded = autoExpandPaths.has(node.fullPath);
  const isExpanded = isAutoExpanded || expandedNamespaces.has(node.fullPath);
  const isNamespaceSelected = selectedNamespace === node.fullPath;
  const isFileSelected = selectedFile === node.fullPath;
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const handleClick = () => {
    if (isLeaf) {
      // Leaf namespace -> open FileView
      onSelectFile(node.fullPath);
    } else {
      // Non-leaf -> toggle expand and select namespace
      toggleNamespace(node.fullPath);
      onSelectNamespace(node.fullPath);
    }
  };

  const isSelected = isLeaf ? isFileSelected : isNamespaceSelected;

  return (
    <div className={css({ mb: level === 0 ? "0" : "1" })}>
      {node.name && (
        <button
          onClick={handleClick}
          data-path={node.fullPath}
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "2",
            width: "100%",
            textAlign: "left",
            px: "3",
            py: "1.5",
            borderRadius: "lg",
            bg: isSelected
              ? "rgba(217, 119, 6, 0.08)"
              : level === 1
                ? "#F5F3EF"
                : "transparent",
            cursor: "pointer",
            transition: "all 0.15s ease",
            _hover: {
              bg: isSelected
                ? "rgba(217, 119, 6, 0.12)"
                : level === 1
                  ? "#EBE8E2"
                  : "#FAF9F6",
            },
          })}
        >
          {isLeaf ? (
            <FileIcon />
          ) : isExpanded ? (
            <FolderOpenIcon />
          ) : (
            <FolderClosedIcon />
          )}
          <span
            className={css({
              flex: 1,
              fontSize: "sm",
              fontWeight: isSelected ? "600" : "500",
              color: isSelected ? "#D97706" : "#44403C",
              wordBreak: "break-all",
            })}
          >
            {node.name}
          </span>
        </button>
      )}

      {(isExpanded || !node.name) && (
        <div
          className={css({
            pl: node.name ? "4" : "0",
            mt: node.name ? "1" : "0",
            borderLeft: node.name ? "2px solid" : "none",
            borderColor: "rgba(217, 119, 6, 0.2)",
            ml: node.name ? "2" : "0",
          })}
        >
          {sortedChildren.map(([key, child]) => (
            <NamespaceTreeView
              key={key}
              node={child}
              level={level + 1}
              expandedNamespaces={expandedNamespaces}
              autoExpandPaths={autoExpandPaths}
              toggleNamespace={toggleNamespace}
              onSelectDef={onSelectDef}
              onSelectNamespace={onSelectNamespace}
              onSelectFile={onSelectFile}
              selectedDefPath={selectedDefPath}
              selectedNamespace={selectedNamespace}
              selectedFile={selectedFile}
            />
          ))}

          {node.defs.map(({ path, def, name }) => {
            const { tag, color } = getTypeTag(def);
            const isSelected = selectedDefPath === path;

            return (
              <button
                key={path}
                onClick={() => onSelectDef(path)}
                data-path={path}
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "2",
                  width: "100%",
                  textAlign: "left",
                  px: "3",
                  py: "1.5",
                  fontSize: "sm",
                  fontWeight: isSelected ? "500" : "normal",
                  color: isSelected ? "#D97706" : "#57534E",
                  bg: isSelected ? "rgba(217, 119, 6, 0.08)" : "transparent",
                  borderRadius: "md",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  borderLeft: isSelected
                    ? "2px solid #D97706"
                    : "2px solid transparent",
                  _hover: { bg: "#FAF9F6", color: "#44403C" },
                })}
              >
                <span
                  className={css({
                    fontSize: "10px",
                    fontWeight: "600",
                    fontFamily: "mono",
                    color: color,
                    minWidth: "24px",
                  })}
                >
                  {tag}
                </span>
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const Sidebar = ({
  onSelectDef,
  onSelectNamespace,
  onSelectFile,
  selectedDefPath,
  selectedNamespace,
  selectedFile,
  expandPath,
  ir,
  standards,
  selectedStandard,
  setSelectedStandard,
  isLoading,
  error,
  width,
  onWidthChange,
}: SidebarProps) => {
  const { serverUrlAtom } = useBunja(serverUrlBunja);
  const [serverUrl, setServerUrl] = useAtom(serverUrlAtom);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(
    new Set(),
  );
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(200, e.clientX), 600);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, onWidthChange]);

  const namespaceTree = useMemo(() => {
    if (!ir) return null;
    return createNamespaceTree(ir);
  }, [ir]);

  const filteredTree = useMemo(() => {
    if (!namespaceTree) return null;
    if (!searchQuery) return namespaceTree;
    return filterNamespaceTree(namespaceTree, searchQuery);
  }, [namespaceTree, searchQuery]);

  const autoExpandPaths = useMemo(() => {
    if (!filteredTree) return new Set<string>();
    return getAutoExpandPaths(filteredTree);
  }, [filteredTree]);

  // Expand ancestors when expandPath changes
  useEffect(() => {
    if (expandPath) {
      const ancestors = getAncestorPaths(expandPath);
      setExpandedNamespaces((prev) => {
        const next = new Set(prev);
        for (const ancestor of ancestors) {
          next.add(ancestor);
        }
        return next;
      });

      // Scroll to the element
      setTimeout(() => {
        const element = document.querySelector(`[data-path="${expandPath}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [expandPath]);

  const toggleNamespace = (path: string) => {
    setExpandedNamespaces((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className={css({
        position: "relative",
        flexShrink: 0,
        borderRight: "1px solid",
        borderColor: "#E8E4DE",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bg: "#FFFFFF",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.03)",
      })}
    >
      {/* Resize handle */}
      <div
        onMouseDown={handleMouseDown}
        className={css({
          position: "absolute",
          top: 0,
          right: "-4px",
          width: "8px",
          height: "100%",
          cursor: "col-resize",
          zIndex: 10,
          bg: "transparent",
          transition: "background 0.15s ease",
          _hover: {
            bg: "rgba(217, 119, 6, 0.15)",
          },
        })}
        style={{
          background: isResizing ? "rgba(217, 119, 6, 0.25)" : undefined,
        }}
      />
      <div
        className={css({
          p: "5",
          borderBottom: "1px solid",
          borderColor: "#E8E4DE",
          bg: "#FDFCFA",
        })}
      >
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            mb: "4",
          })}
        >
          <div
            className={css({
              width: "36px",
              height: "36px",
              borderRadius: "lg",
              bg: "linear-gradient(135deg, #D97706 0%, #EA580C 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.25)",
            })}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L20 7V17L12 22L4 17V7L12 2Z"
                fill="white"
                opacity="0.9"
              />
            </svg>
          </div>
          <h1
            className={css({
              fontSize: "xl",
              fontWeight: "600",
              color: "#1C1917",
              letterSpacing: "-0.02em",
            })}
          >
            BDL Viewer
          </h1>
        </div>

        <div className={css({ mb: "3" })}>
          <label
            className={css({
              display: "block",
              fontSize: "xs",
              fontWeight: "500",
              color: "#78716C",
              mb: "1.5",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            })}
          >
            Server URL
          </label>
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className={css({
              width: "100%",
              px: "3",
              py: "2",
              border: "1px solid",
              borderColor: "#E8E4DE",
              borderRadius: "lg",
              fontSize: "sm",
              bg: "white",
              color: "#1C1917",
              transition: "all 0.2s ease",
              _focus: {
                outline: "none",
                borderColor: "#D97706",
                boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)",
              },
            })}
          />
        </div>

        {standards.length > 0 && (
          <div className={css({ mb: "3" })}>
            <label
              className={css({
                display: "block",
                fontSize: "xs",
                fontWeight: "500",
                color: "#78716C",
                mb: "1.5",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              })}
            >
              Standard
            </label>
            <select
              value={selectedStandard || ""}
              onChange={(e) => setSelectedStandard(e.target.value)}
              className={css({
                width: "100%",
                px: "3",
                py: "2",
                border: "1px solid",
                borderColor: "#E8E4DE",
                borderRadius: "lg",
                fontSize: "sm",
                bg: "white",
                color: "#1C1917",
                cursor: "pointer",
                transition: "all 0.2s ease",
                _focus: {
                  outline: "none",
                  borderColor: "#D97706",
                  boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)",
                },
              })}
            >
              {standards.map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={css({ position: "relative" })}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={css({
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#A8A29E",
            })}
          >
            <path
              d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search definitions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={css({
              width: "100%",
              pl: "10",
              pr: "3",
              py: "2.5",
              border: "1px solid",
              borderColor: "#E8E4DE",
              borderRadius: "lg",
              fontSize: "sm",
              bg: "white",
              color: "#1C1917",
              transition: "all 0.2s ease",
              _placeholder: { color: "#A8A29E" },
              _focus: {
                outline: "none",
                borderColor: "#D97706",
                boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)",
              },
            })}
          />
        </div>
      </div>

      <div
        className={css({
          flex: "1",
          overflowY: "auto",
          p: "3",
        })}
      >
        {isLoading && (
          <div
            className={css({
              p: "6",
              color: "#A8A29E",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3",
            })}
          >
            <div
              className={css({
                width: "24px",
                height: "24px",
                border: "2px solid #E8E4DE",
                borderTopColor: "#D97706",
                borderRadius: "full",
                animation: "spin 1s linear infinite",
              })}
            />
            Loading...
          </div>
        )}

        {error && (
          <div
            className={css({
              p: "4",
              color: "#DC2626",
              fontSize: "sm",
              bg: "#FEF2F2",
              borderRadius: "lg",
              border: "1px solid #FECACA",
            })}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && !filteredTree && (
          <div
            className={css({ p: "6", color: "#A8A29E", textAlign: "center" })}
          >
            No definitions found
          </div>
        )}

        {filteredTree && (
          <NamespaceTreeView
            node={filteredTree}
            level={0}
            expandedNamespaces={expandedNamespaces}
            autoExpandPaths={autoExpandPaths}
            toggleNamespace={toggleNamespace}
            onSelectDef={onSelectDef}
            onSelectNamespace={onSelectNamespace}
            onSelectFile={onSelectFile}
            selectedDefPath={selectedDefPath}
            selectedNamespace={selectedNamespace}
            selectedFile={selectedFile}
          />
        )}
      </div>
    </aside>
  );
};
