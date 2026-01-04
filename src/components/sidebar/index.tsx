import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAtom, useAtomValue } from "jotai";
import { useBunja } from "bunja/react";
import { css } from "../../../styled-system/css";
import { hstack, vstack } from "../../../styled-system/patterns";
import {
  serverUrlBunja,
  sidebarBunja,
  viewBunja,
  coreBunja,
  serverUrlScope,
} from "../../state/bdl";
import { getTypeTag } from "../../shared/type-tag";
import {
  createNamespaceTree,
  filterNamespaceTree,
  getAutoExpandPaths,
  getAncestorPaths,
  isLeafNamespace,
} from "./fns";
import {
  FolderClosedIcon,
  FolderOpenIcon,
  FileIcon,
  GithubIcon,
  MenuIcon,
  CloseIcon,
} from "./icons";

import type { NamespaceNode } from "./fns";

// ============================================================================
// Exported Component
// ============================================================================

export interface SidebarProps {
  onSelectDef: (defPath: string) => void;
  onSelectNamespace: (namespacePath: string) => void;
  onSelectFile: (namespacePath: string) => void;
}

export const Sidebar = ({
  onSelectDef,
  onSelectNamespace,
  onSelectFile,
}: SidebarProps) => {
  // Bunja state
  const { serverUrlAtom } = useBunja(serverUrlBunja);
  const [serverUrl, setServerUrl] = useAtom(serverUrlAtom);

  const { sidebarExpandPathAtom, sidebarWidthAtom, sidebarCollapsedAtom } =
    useBunja(sidebarBunja);
  const expandPath = useAtomValue(sidebarExpandPathAtom);
  const [width, setWidth] = useAtom(sidebarWidthAtom);
  const [isCollapsed, setIsCollapsed] = useAtom(sidebarCollapsedAtom);

  const { selectionAtom, viewModeAtom } = useBunja(coreBunja);
  const selection = useAtomValue(selectionAtom);
  const viewMode = useAtomValue(viewModeAtom);

  const { irQueryAtom, standardsQueryAtom, selectedStandardAtom } = useBunja(
    viewBunja,
    [serverUrlScope.bind(serverUrl)],
  );

  const { data: ir, isLoading: isLoadingIr } = useAtomValue(irQueryAtom);
  const {
    data: standards,
    isLoading: isLoadingStandards,
    error: standardsError,
  } = useAtomValue(standardsQueryAtom);
  const [selectedStandard, setSelectedStandard] = useAtom(selectedStandardAtom);

  // Derived selection state
  const selectedDefPath = selection.type === "def" ? selection.path : null;
  const selectedNamespace =
    viewMode === "explorer" && selection.type === "namespace"
      ? selection.path
      : null;
  const selectedFile =
    selection.type === "file" ? selection.namespacePath : null;

  // Loading and error state
  const isLoading = isLoadingStandards || isLoadingIr;
  const error = standardsError?.message || null;

  // Local state
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(
    new Set(),
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const sidebarRef = useRef<HTMLElement>(null);

  // Toggle collapse
  const onToggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed, setIsCollapsed]);

  // Track window size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      if (desktop) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.min(Math.max(200, e.clientX), 600);
      setWidth(newWidth);
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
  }, [isResizing, setWidth]);

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

  // Wrapped callbacks that close mobile menu
  const wrappedOnSelectDef = useCallback(
    (defPath: string) => {
      onSelectDef(defPath);
      setIsMobileMenuOpen(false);
    },
    [onSelectDef],
  );

  const wrappedOnSelectNamespace = useCallback(
    (namespacePath: string) => {
      onSelectNamespace(namespacePath);
      setIsMobileMenuOpen(false);
    },
    [onSelectNamespace],
  );

  const wrappedOnSelectFile = useCallback(
    (namespacePath: string) => {
      onSelectFile(namespacePath);
      setIsMobileMenuOpen(false);
    },
    [onSelectFile],
  );

  return (
    <>
      {/* Mobile menu button */}
      <MobileMenuButton
        isOpen={isMobileMenuOpen}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <MobileOverlay onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <aside
        ref={sidebarRef}
        className={css({
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
          width: "85vw",
          maxWidth: "400px",
          flexShrink: 0,
          borderRight: "1px solid {colors.border}",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          bg: "bg.card",
          boxShadow: "sidebar",
          transition: "transform 0.3s ease, width 0.3s ease",
          md: {
            position: "relative",
            zIndex: "auto",
            maxWidth: "none",
          },
        })}
        style={{
          transform: isMobileMenuOpen ? "translateX(0)" : "translateX(-100%)",
          ...(isDesktop && {
            transform: "translateX(0)",
            width: isCollapsed ? "60px" : `${width}px`,
          }),
        }}
      >
        {/* Resize handle */}
        {!isCollapsed && (
          <ResizeHandle onMouseDown={handleMouseDown} isResizing={isResizing} />
        )}

        {/* Header */}
        <SidebarHeader
          isCollapsed={isCollapsed}
          isDesktop={isDesktop}
          onToggleCollapse={onToggleCollapse}
          serverUrl={serverUrl}
          setServerUrl={setServerUrl}
          standards={standards ?? []}
          selectedStandard={selectedStandard}
          setSelectedStandard={setSelectedStandard}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Content */}
        {!isCollapsed && (
          <SidebarContent
            isLoading={isLoading}
            error={error}
            filteredTree={filteredTree}
            expandedNamespaces={expandedNamespaces}
            autoExpandPaths={autoExpandPaths}
            toggleNamespace={toggleNamespace}
            onSelectDef={wrappedOnSelectDef}
            onSelectNamespace={wrappedOnSelectNamespace}
            onSelectFile={wrappedOnSelectFile}
            selectedDefPath={selectedDefPath}
            selectedNamespace={selectedNamespace}
            selectedFile={selectedFile}
          />
        )}
      </aside>
    </>
  );
};

// ============================================================================
// Internal Components
// ============================================================================

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
      onSelectFile(node.fullPath);
    } else {
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
          className={hstack({
            gap: "2",
            width: "100%",
            textAlign: "left",
            px: "3",
            py: "1.5",
            borderRadius: "lg",
            bg: isSelected
              ? "accent.lighter"
              : level === 1
                ? "bg.muted"
                : "transparent",
            cursor: "pointer",
            transition: "all 0.15s ease",
            _hover: {
              bg: isSelected
                ? "accent.light"
                : level === 1
                  ? "bg.hover"
                  : "bg",
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
              color: isSelected ? "accent" : "text.secondary",
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
            pl: node.name ? "2" : "0",
            mt: node.name ? "1" : "0",
            borderLeft: node.name ? "2px solid rgba(217, 119, 6, 0.1)" : "none",
            ml: node.name ? "5" : "0",
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
            const { tag, color, bgColor } = getTypeTag(def);
            const isSelected = selectedDefPath === path;

            return (
              <button
                key={path}
                onClick={() => onSelectDef(path)}
                data-path={path}
                className={hstack({
                  gap: "2.5",
                  width: "100%",
                  textAlign: "left",
                  px: "3",
                  py: "1.5",
                  fontSize: "sm",
                  fontWeight: isSelected ? "500" : "normal",
                  color: isSelected ? "accent" : "text.tertiary",
                  bg: isSelected ? "accent.lighter" : "transparent",
                  borderRadius: "md",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  _hover: { bg: "bg", color: "text.secondary" },
                })}
              >
                <span
                  className={css({
                    fontSize: "9px",
                    fontWeight: "600",
                    fontFamily: "mono",
                    minWidth: "20px",
                    height: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "full",
                    flexShrink: 0,
                  })}
                  style={{ color, backgroundColor: bgColor }}
                >
                  {tag}
                </span>
                <span className={css({ ml: "1" })}>{name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const MobileMenuButton = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={css({
      position: "fixed",
      top: "16px",
      left: "16px",
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "48px",
      height: "48px",
      bg: "bg.card",
      border: "1px solid #E8E4DE",
      borderRadius: "lg",
      color: "text",
      cursor: "pointer",
      boxShadow: "mobileBtn",
      transition: "all 0.2s ease",
      _hover: {
        bg: "bg",
        borderColor: "accent",
      },
      md: {
        display: "none",
      },
    })}
  >
    {isOpen ? <CloseIcon /> : <MenuIcon />}
  </button>
);

const MobileOverlay = ({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className={css({
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 40,
      bg: "overlay",
      md: {
        display: "none",
      },
    })}
  />
);

const ResizeHandle = ({
  onMouseDown,
  isResizing,
}: {
  onMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}) => (
  <div
    onMouseDown={onMouseDown}
    className={css({
      display: "none",
      md: {
        display: "block",
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
          bg: "accent.light",
        },
      },
    })}
    style={{
      background: isResizing ? "rgba(217, 119, 6, 0.25)" : undefined,
    }}
  />
);

interface SidebarHeaderProps {
  isCollapsed: boolean;
  isDesktop: boolean;
  onToggleCollapse: () => void;
  serverUrl: string;
  setServerUrl: (url: string) => void;
  standards: string[];
  selectedStandard: string | null;
  setSelectedStandard: (standard: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const SidebarHeader = ({
  isCollapsed,
  isDesktop,
  onToggleCollapse,
  serverUrl,
  setServerUrl,
  standards,
  selectedStandard,
  setSelectedStandard,
  searchQuery,
  setSearchQuery,
}: SidebarHeaderProps) => (
  <div
    className={css({
      p: "5",
      borderBottom: "1px solid #E8E4DE",
      bg: "bg.subtle",
    })}
    style={{
      padding: isCollapsed && isDesktop ? "12px" : undefined,
    }}
  >
    <div
      className={hstack({
        justify: "space-between",
        mb: "4",
      })}
      style={{
        marginBottom: isCollapsed && isDesktop ? "0" : undefined,
        flexDirection: isCollapsed && isDesktop ? "column" : undefined,
        gap: isCollapsed && isDesktop ? "12px" : undefined,
      }}
    >
      <div className={hstack({ gap: "3" })}>
        <button
          onClick={isCollapsed ? onToggleCollapse : undefined}
          className={css({
            width: "36px",
            height: "36px",
            borderRadius: "lg",
            bg: "linear-gradient(135deg, #D97706 0%, #EA580C 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "accent",
            cursor: isCollapsed ? "pointer" : "default",
            transition: "all 0.2s ease",
            _hover: isCollapsed
              ? {
                  boxShadow: "accentHover",
                }
              : {},
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
        </button>
        {!isCollapsed && (
          <h1
            className={css({
              fontSize: "xl",
              fontWeight: "600",
              color: "text",
              letterSpacing: "-0.02em",
            })}
          >
            BDL Viewer
          </h1>
        )}
      </div>

      <div className={hstack({ gap: "2" })}>
        <button
          onClick={onToggleCollapse}
          className={css({
            color: "text.muted",
            transition: "all 0.2s ease",
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            md: {
              display: "flex",
            },
            _hover: {
              color: "text",
            },
          })}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {!isCollapsed && (
          <a
            href="https://github.com/hyp3rflow/bdlview"
            target="_blank"
            rel="noopener noreferrer"
            className={css({
              color: "text.muted",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              _hover: {
                color: "text",
              },
            })}
          >
            <GithubIcon />
          </a>
        )}
      </div>
    </div>

    {!isCollapsed && (
      <>
        <FormField label="Server URL">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            className={inputStyle}
          />
        </FormField>

        {standards.length > 0 && (
          <FormField label="Standard">
            <div className={css({ position: "relative" })}>
              <select
                value={selectedStandard || ""}
                onChange={(e) => setSelectedStandard(e.target.value)}
                className={css({
                  width: "100%",
                  pl: "3",
                  pr: "10",
                  py: "2",
                  border: "1px solid #E8E4DE",
                  borderRadius: "lg",
                  fontSize: "sm",
                  bg: "white",
                  color: "text",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  appearance: "none",
                  _focus: {
                    outline: "none",
                    border: "1px solid #D97706",
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
              <ChevronDownIcon />
            </div>
          </FormField>
        )}

        <div className={css({ position: "relative" })}>
          <SearchIcon />
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
              border: "1px solid #E8E4DE",
              borderRadius: "lg",
              fontSize: "sm",
              bg: "white",
              color: "text",
              transition: "all 0.2s ease",
              _placeholder: { color: "text.placeholder" },
              _focus: {
                outline: "none",
                border: "1px solid #D97706",
                boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)",
              },
            })}
          />
        </div>
      </>
    )}
  </div>
);

interface SidebarContentProps {
  isLoading: boolean;
  error: string | null;
  filteredTree: NamespaceNode | null;
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

const SidebarContent = ({
  isLoading,
  error,
  filteredTree,
  expandedNamespaces,
  autoExpandPaths,
  toggleNamespace,
  onSelectDef,
  onSelectNamespace,
  onSelectFile,
  selectedDefPath,
  selectedNamespace,
  selectedFile,
}: SidebarContentProps) => (
  <div
    className={css({
      flex: "1",
      overflowY: "auto",
      p: "3",
    })}
  >
    {isLoading && (
      <div
        className={vstack({
          gap: "3",
          p: "6",
          color: "text.placeholder",
          textAlign: "center",
        })}
      >
        <div
          className={css({
            width: "24px",
            height: "24px",
            border: "2px solid #E8E4DE",
            borderTopColor: "accent",
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
          color: "error",
          fontSize: "sm",
          bg: "error.bg",
          borderRadius: "lg",
          border: "1px solid #FECACA",
        })}
      >
        {error}
      </div>
    )}

    {!isLoading && !error && !filteredTree && (
      <div
        className={css({
          p: "6",
          color: "text.placeholder",
          textAlign: "center",
        })}
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
);

// ============================================================================
// Helpers
// ============================================================================

const inputStyle = css({
  width: "100%",
  px: "3",
  py: "2",
  border: "1px solid #E8E4DE",
  borderRadius: "lg",
  fontSize: "sm",
  bg: "white",
  color: "text",
  transition: "all 0.2s ease",
  _focus: {
    outline: "none",
    border: "1px solid #D97706",
    boxShadow: "0 0 0 3px rgba(217, 119, 6, 0.1)",
  },
});

const FormField = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className={css({ mb: "3" })}>
    <label
      className={css({
        display: "block",
        fontSize: "xs",
        fontWeight: "500",
        color: "text.muted",
        mb: "1.5",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      })}
    >
      {label}
    </label>
    {children}
  </div>
);

const SearchIcon = () => (
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
      color: "text.placeholder",
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
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={css({
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
      color: "text.muted",
    })}
  >
    <path
      d="M6 9L12 15L18 9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
