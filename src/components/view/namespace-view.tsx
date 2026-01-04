import { css } from "../../../styled-system/css";
import { hstack, wrap } from "../../../styled-system/patterns";
import type { BdlIr } from "../../types/bdl";
import {
  type NamespaceNode,
  createNamespaceTree,
  getNodeAtPath,
  isLeafNamespace,
} from "../sidebar/fns";
import { DefCard } from "../def-detail";

// ============================================================================
// Types
// ============================================================================

interface NamespaceViewProps {
  ir: BdlIr;
  namespacePath: string;
  onSelectDef: (defPath: string) => void;
  onSelectNamespace: (namespacePath: string) => void;
  onSelectFile: (namespacePath: string) => void;
}

// ============================================================================
// Exported Component
// ============================================================================

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
      <div className={css({ p: "6", color: "text.placeholder" })}>
        Namespace not found: {namespacePath}
      </div>
    );
  }

  const pathParts = namespacePath ? namespacePath.split(".") : [];
  const sortedChildren = Array.from(node.children.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className={containerStyle}>
      {/* Breadcrumb */}
      <div className={wrap({ gap: "2", mb: "4" })}>
        <button
          onClick={() => onSelectNamespace("")}
          className={breadcrumbStyle}
        >
          root
        </button>
        {pathParts.map((part, index) => (
          <span key={index} className={hstack({ gap: "2" })}>
            <span className={css({ color: "text.placeholder" })}>/</span>
            <button
              onClick={() =>
                onSelectNamespace(pathParts.slice(0, index + 1).join("."))
              }
              className={css({
                fontSize: "sm",
                color:
                  index === pathParts.length - 1
                    ? "text.secondary"
                    : "text.muted",
                fontWeight: index === pathParts.length - 1 ? "600" : "normal",
                cursor: "pointer",
                _hover: { color: "accent" },
              })}
            >
              {part}
            </button>
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className={titleStyle}>{namespacePath || "Root"}</h1>

      {/* Child namespaces */}
      {sortedChildren.length > 0 && (
        <div className={css({ mb: "8" })}>
          <h2 className={sectionTitleStyle}>Namespaces</h2>
          <div className={gridStyle}>
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
                  className={namespaceCardStyle}
                >
                  {isLeaf ? <FileIcon /> : <FolderIcon />}
                  <div>
                    <div className={css({ fontWeight: "500", color: "text.secondary" })}>
                      {child.name}
                    </div>
                    <div className={css({ fontSize: "xs", color: "text.placeholder" })}>
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
          <h2 className={sectionTitleStyle}>Definitions</h2>
          <div className={defsGridStyle}>
            {node.defs.map(({ path, def, name }) => (
              <DefCard
                key={path}
                def={def}
                name={name}
                onClick={() => onSelectDef(path)}
              />
            ))}
          </div>
        </div>
      )}

      {sortedChildren.length === 0 && node.defs.length === 0 && (
        <div className={emptyStyle}>This namespace is empty</div>
      )}
    </div>
  );
};

// ============================================================================
// Internal Components
// ============================================================================

const FolderIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
      fill="var(--colors-folder-closed)"
      stroke="var(--colors-folder-stroke)"
      strokeWidth="1"
    />
  </svg>
);

const FileIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      fill="var(--colors-file-fill)"
      stroke="var(--colors-file-stroke)"
      strokeWidth="1"
    />
    <path d="M14 2V8H20" stroke="var(--colors-file-stroke)" strokeWidth="1" />
  </svg>
);

// ============================================================================
// Helpers
// ============================================================================

const countAllDefs = (node: NamespaceNode): number => {
  let count = node.defs.length;
  for (const child of node.children.values()) {
    count += countAllDefs(child);
  }
  return count;
};

// ============================================================================
// Styles
// ============================================================================

const containerStyle = css({
  p: "4",
  maxWidth: "1400px",
  md: { p: "6" },
});

const breadcrumbStyle = css({
  fontSize: "sm",
  color: "text.muted",
  cursor: "pointer",
  _hover: { color: "accent" },
});

const titleStyle = css({
  fontSize: "xl",
  fontWeight: "bold",
  color: "text",
  mb: "4",
  md: {
    fontSize: "2xl",
    mb: "6",
  },
});

const sectionTitleStyle = css({
  fontSize: "sm",
  fontWeight: "600",
  color: "text.muted",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  mb: "3",
});

const gridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  md: {
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  },
});

const defsGridStyle = css({
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "3",
  md: {
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  },
});

const namespaceCardStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  p: "4",
  bg: "bg.subtle",
  border: "1px solid #E8E4DE",
  borderRadius: "lg",
  cursor: "pointer",
  textAlign: "left",
  transition: "all 0.15s ease",
  _hover: {
    border: "1px solid #D97706",
    bg: "accent.lightest",
  },
});

const emptyStyle = css({
  color: "text.placeholder",
  textAlign: "center",
  py: "12",
});
