import { css } from "../../../styled-system/css";
import type { BdlIr, Def } from "../../types/bdl";
import {
  type NamespaceNode,
  createNamespaceTree,
  getNodeAtPath,
} from "../sidebar";

interface NamespaceViewProps {
  ir: BdlIr;
  namespacePath: string;
  onSelectDef: (defPath: string) => void;
  onSelectNamespace: (namespacePath: string) => void;
  onSelectFile: (namespacePath: string) => void;
}

const getTypeTag = (
  def: Def,
): { tag: string; label: string; color: string; bgColor: string } => {
  switch (def.type) {
    case "Proc":
      return {
        tag: "rpc",
        label: "Procedure",
        color: "#2563EB",
        bgColor: "#EFF6FF",
      };
    case "Struct":
      return {
        tag: "s",
        label: "Struct",
        color: "#7C3AED",
        bgColor: "#F5F3FF",
      };
    case "Enum":
      return { tag: "e", label: "Enum", color: "#059669", bgColor: "#ECFDF5" };
    case "Union":
      return { tag: "u", label: "Union", color: "#EA580C", bgColor: "#FFF7ED" };
    case "Oneof":
      return { tag: "o", label: "Oneof", color: "#0891B2", bgColor: "#ECFEFF" };
    case "Custom":
      return { tag: "t", label: "Type", color: "#78716C", bgColor: "#F5F5F4" };
  }
};

const countAllDefs = (node: NamespaceNode): number => {
  let count = node.defs.length;
  for (const child of node.children.values()) {
    count += countAllDefs(child);
  }
  return count;
};

const FolderIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

const FileIcon = () => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
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

// Check if a namespace is a leaf (has defs but no child namespaces)
const isLeafNamespace = (node: NamespaceNode): boolean => {
  return node.defs.length > 0 && node.children.size === 0;
};

export const NamespaceView = ({
  ir,
  namespacePath,
  onSelectDef,
  onSelectNamespace,
  onSelectFile,
}: NamespaceViewProps) => {
  const tree = createNamespaceTree(ir);
  const node = getNodeAtPath(tree, namespacePath);

  if (!node) {
    return (
      <div className={css({ p: "6", color: "#A8A29E" })}>
        Namespace not found: {namespacePath}
      </div>
    );
  }

  const pathParts = namespacePath ? namespacePath.split(".") : [];
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className={css({ p: "6", maxWidth: "1200px" })}>
      {/* Breadcrumb */}
      <div
        className={css({
          display: "flex",
          alignItems: "center",
          gap: "2",
          mb: "4",
          flexWrap: "wrap",
        })}
      >
        <button
          onClick={() => onSelectNamespace("")}
          className={css({
            fontSize: "sm",
            color: "#78716C",
            cursor: "pointer",
            _hover: { color: "#D97706" },
          })}
        >
          root
        </button>
        {pathParts.map((part, index) => (
          <span
            key={index}
            className={css({ display: "flex", alignItems: "center", gap: "2" })}
          >
            <span className={css({ color: "#D1D5DB" })}>/</span>
            <button
              onClick={() =>
                onSelectNamespace(pathParts.slice(0, index + 1).join("."))
              }
              className={css({
                fontSize: "sm",
                color: index === pathParts.length - 1 ? "#44403C" : "#78716C",
                fontWeight: index === pathParts.length - 1 ? "600" : "normal",
                cursor: "pointer",
                _hover: { color: "#D97706" },
              })}
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Title */}
      <h1
        className={css({
          fontSize: "2xl",
          fontWeight: "bold",
          color: "#1C1917",
          mb: "6",
        })}
      >
        {namespacePath || "Root"}
      </h1>

      {/* Child namespaces */}
      {sortedChildren.length > 0 && (
        <div className={css({ mb: "8" })}>
          <h2
            className={css({
              fontSize: "sm",
              fontWeight: "600",
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              mb: "3",
            })}
          >
            Namespaces
          </h2>
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "3",
            })}
          >
            {sortedChildren.map(([key, child]) => {
              const isLeaf = isLeafNamespace(child);
              return (
                <button
                  key={key}
                  onClick={() =>
                    isLeaf
                      ? onSelectFile(child.fullPath)
                      : onSelectNamespace(child.fullPath)
                  }
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "3",
                    p: "4",
                    bg: "#FDFCFA",
                    border: "1px solid #E8E4DE",
                    borderRadius: "lg",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    _hover: {
                      border: "1px solid #D97706",
                      bg: "rgba(217, 119, 6, 0.04)",
                    },
                  })}
                >
                  {isLeaf ? <FileIcon /> : <FolderIcon />}
                  <div>
                    <div
                      className={css({
                        fontWeight: "500",
                        color: "#44403C",
                      })}
                    >
                      {child.name}
                    </div>
                    <div
                      className={css({
                        fontSize: "xs",
                        color: "#A8A29E",
                      })}
                    >
                      {countAllDefs(child)} {isLeaf ? "definition" : "item"}
                      {countAllDefs(child) !== 1 ? "s" : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Definitions */}
      {node.defs.length > 0 && (
        <div>
          <h2
            className={css({
              fontSize: "sm",
              fontWeight: "600",
              color: "#78716C",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              mb: "3",
            })}
          >
            Definitions
          </h2>
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "3",
            })}
          >
            {node.defs.map(({ path, def, name }) => {
              const { tag, label, color, bgColor } = getTypeTag(def);
              const description =
                def.attributes["description"] || def.attributes["doc"];

              return (
                <button
                  key={path}
                  onClick={() => onSelectDef(path)}
                  className={css({
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2",
                    p: "4",
                    bg: "#FFFFFF",
                    border: "1px solid #E8E4DE",
                    borderRadius: "lg",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                    _hover: {
                      border: "1px solid #D97706",
                      bg: "rgba(217, 119, 6, 0.04)",
                    },
                  })}
                >
                  <div
                    className={css({
                      display: "flex",
                      alignItems: "center",
                      gap: "2",
                      width: "100%",
                    })}
                  >
                    <span
                      className={css({
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: "mono",
                        color: color,
                        bg: bgColor,
                        px: "1.5",
                        py: "0.5",
                        borderRadius: "sm",
                      })}
                    >
                      {tag}
                    </span>
                    <span
                      className={css({
                        fontWeight: "500",
                        color: "#44403C",
                        flex: 1,
                      })}
                    >
                      {name}
                    </span>
                  </div>
                  <div
                    className={css({
                      fontSize: "xs",
                      color: "#A8A29E",
                    })}
                  >
                    {label}
                  </div>
                  {description && (
                    <div
                      className={css({
                        fontSize: "sm",
                        color: "#78716C",
                        lineHeight: "1.4",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineClamp: 2,
                      })}
                    >
                      {description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sortedChildren.length === 0 && node.defs.length === 0 && (
        <div
          className={css({ color: "#A8A29E", textAlign: "center", py: "12" })}
        >
          This namespace is empty
        </div>
      )}
    </div>
  );
};
