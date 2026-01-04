import { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import { css } from "../../styled-system/css";
import type { BdlIr, Def } from "../types/bdl";

interface CommandPaletteProps {
  ir: BdlIr | null;
  onSelectDef: (defPath: string) => void;
  onSelectFile: (namespacePath: string) => void;
}

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

interface DefItem {
  path: string;
  name: string;
  namespace: string;
  def: Def;
}

interface FileItem {
  path: string;
  name: string;
  defCount: number;
}

export const CommandPalette = ({ ir, onSelectDef, onSelectFile }: CommandPaletteProps) => {
  const [open, setOpen] = useState(false);

  // Toggle the menu when ⌘K / Ctrl+K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Build lists of definitions and files (leaf namespaces)
  const { defs, files } = useMemo(() => {
    if (!ir) return { defs: [], files: [] };

    const defs: DefItem[] = [];
    const namespaceDefCounts = new Map<string, number>();
    const namespacesWithChildren = new Set<string>();

    // First pass: collect all definitions and count per namespace
    for (const [defPath, def] of Object.entries(ir.defs)) {
      const parts = defPath.split(".");
      const defName = parts.pop()!;
      const namespace = parts.join(".");

      defs.push({
        path: defPath,
        name: defName,
        namespace,
        def,
      });

      namespaceDefCounts.set(namespace, (namespaceDefCounts.get(namespace) || 0) + 1);

      // Mark all parent namespaces as having children
      for (let i = 1; i < parts.length; i++) {
        const parentPath = parts.slice(0, i).join(".");
        namespacesWithChildren.add(parentPath);
      }
    }

    // Find leaf namespaces (have defs but no child namespaces)
    const files: FileItem[] = [];
    for (const [namespace, count] of namespaceDefCounts) {
      if (!namespacesWithChildren.has(namespace)) {
        const parts = namespace.split(".");
        files.push({
          path: namespace,
          name: parts[parts.length - 1],
          defCount: count,
        });
      }
    }

    // Sort
    defs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    return { defs, files };
  }, [ir]);

  const handleSelectDef = (defPath: string) => {
    onSelectDef(defPath);
    setOpen(false);
  };

  const handleSelectFile = (namespacePath: string) => {
    onSelectFile(namespacePath);
    setOpen(false);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command Palette"
      className={css({
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: "640px",
        bg: "white",
        borderRadius: "xl",
        boxShadow: "0 16px 70px rgba(0, 0, 0, 0.2)",
        border: "1px solid",
        borderColor: "#E8E4DE",
        overflow: "hidden",
        zIndex: 1000,
      })}
      overlayClassName={css({
        position: "fixed",
        inset: 0,
        bg: "rgba(0, 0, 0, 0.5)",
        zIndex: 999,
      })}
    >
      <Command.Input
        placeholder="Search definitions and files..."
        className={css({
          width: "100%",
          px: "4",
          py: "4",
          fontSize: "md",
          border: "none",
          borderBottom: "1px solid",
          borderColor: "#E8E4DE",
          outline: "none",
          bg: "transparent",
          color: "#1C1917",
          _placeholder: { color: "#A8A29E" },
        })}
      />
      <Command.List
        className={css({
          maxHeight: "400px",
          overflowY: "auto",
          p: "2",
        })}
      >
        <Command.Empty
          className={css({
            py: "6",
            textAlign: "center",
            color: "#A8A29E",
            fontSize: "sm",
          })}
        >
          No results found.
        </Command.Empty>

        {files.length > 0 && (
          <Command.Group
            heading="Files"
            className={css({
              "& [cmdk-group-heading]": {
                px: "2",
                py: "1.5",
                fontSize: "xs",
                fontWeight: "600",
                color: "#78716C",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              },
            })}
          >
            {files.map((file) => (
              <Command.Item
                key={`file:${file.path}`}
                value={`file:${file.path} ${file.name}`}
                onSelect={() => handleSelectFile(file.path)}
                className={css({
                  display: "flex",
                  alignItems: "center",
                  gap: "3",
                  px: "3",
                  py: "2",
                  borderRadius: "lg",
                  cursor: "pointer",
                  color: "#44403C",
                  fontSize: "sm",
                  transition: "all 0.1s ease",
                  "&[data-selected=true]": {
                    bg: "rgba(217, 119, 6, 0.1)",
                    color: "#D97706",
                  },
                })}
              >
                <svg
                  width="16"
                  height="16"
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
                <span className={css({ flex: 1 })}>{file.name}</span>
                <span className={css({ fontSize: "xs", color: "#A8A29E" })}>
                  {file.defCount} def{file.defCount !== 1 ? "s" : ""}
                </span>
                <span className={css({ fontSize: "xs", color: "#A8A29E", fontFamily: "mono" })}>
                  {file.path}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {defs.length > 0 && (
          <Command.Group
            heading="Definitions"
            className={css({
              "& [cmdk-group-heading]": {
                px: "2",
                py: "1.5",
                fontSize: "xs",
                fontWeight: "600",
                color: "#78716C",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              },
            })}
          >
            {defs.map((item) => {
              const { tag, color } = getTypeTag(item.def);
              return (
                <Command.Item
                  key={`def:${item.path}`}
                  value={`def:${item.path} ${item.name} ${item.namespace}`}
                  onSelect={() => handleSelectDef(item.path)}
                  className={css({
                    display: "flex",
                    alignItems: "center",
                    gap: "3",
                    px: "3",
                    py: "2",
                    borderRadius: "lg",
                    cursor: "pointer",
                    color: "#44403C",
                    fontSize: "sm",
                    transition: "all 0.1s ease",
                    "&[data-selected=true]": {
                      bg: "rgba(217, 119, 6, 0.1)",
                      color: "#D97706",
                    },
                  })}
                >
                  <span
                    style={{ color }}
                    className={css({
                      fontSize: "10px",
                      fontWeight: "600",
                      fontFamily: "mono",
                      minWidth: "28px",
                    })}
                  >
                    {tag}
                  </span>
                  <span className={css({ flex: 1, fontWeight: "500" })}>{item.name}</span>
                  <span className={css({ fontSize: "xs", color: "#A8A29E", fontFamily: "mono" })}>
                    {item.namespace}
                  </span>
                </Command.Item>
              );
            })}
          </Command.Group>
        )}
      </Command.List>

      <div
        className={css({
          px: "3",
          py: "2",
          borderTop: "1px solid",
          borderColor: "#E8E4DE",
          display: "flex",
          alignItems: "center",
          gap: "4",
          fontSize: "xs",
          color: "#A8A29E",
        })}
      >
        <span className={css({ display: "flex", alignItems: "center", gap: "1" })}>
          <kbd className={css({ px: "1.5", py: "0.5", bg: "#F5F3EF", borderRadius: "sm", fontFamily: "mono" })}>↑↓</kbd>
          navigate
        </span>
        <span className={css({ display: "flex", alignItems: "center", gap: "1" })}>
          <kbd className={css({ px: "1.5", py: "0.5", bg: "#F5F3EF", borderRadius: "sm", fontFamily: "mono" })}>↵</kbd>
          select
        </span>
        <span className={css({ display: "flex", alignItems: "center", gap: "1" })}>
          <kbd className={css({ px: "1.5", py: "0.5", bg: "#F5F3EF", borderRadius: "sm", fontFamily: "mono" })}>esc</kbd>
          close
        </span>
      </div>
    </Command.Dialog>
  );
};
