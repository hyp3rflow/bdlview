import { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import type { BdlIr, Def } from "../types/bdl";
import { getTypeTag } from "../shared/type-tag";

// ============================================================================
// Types
// ============================================================================

interface CommandPaletteProps {
  ir: BdlIr | null;
  onSelectDef: (defPath: string) => void;
  onSelectFile: (namespacePath: string) => void;
}

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

// ============================================================================
// Exported Component
// ============================================================================

export const CommandPalette = ({
  ir,
  onSelectDef,
  onSelectFile,
}: CommandPaletteProps) => {
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

      namespaceDefCounts.set(
        namespace,
        (namespaceDefCounts.get(namespace) || 0) + 1,
      );

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
      className={dialogStyle}
      overlayClassName={overlayStyle}
    >
      <Command.Input placeholder="Search definitions and files..." className={inputStyle} />
      <Command.List className={listStyle}>
        <Command.Empty className={emptyStyle}>No results found.</Command.Empty>

        {files.length > 0 && (
          <Command.Group heading="Files" className={groupStyle}>
            {files.map((file) => (
              <Command.Item
                key={`file:${file.path}`}
                value={`file:${file.path} ${file.name}`}
                onSelect={() => handleSelectFile(file.path)}
                className={itemStyle}
              >
                <FileIcon />
                <span className={css({ flex: 1 })}>{file.name}</span>
                <span className={defCountStyle}>
                  {file.defCount} def{file.defCount !== 1 ? "s" : ""}
                </span>
                <span className={pathStyle}>{file.path}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {defs.length > 0 && (
          <Command.Group heading="Definitions" className={groupStyle}>
            {defs.map((item) => {
              const { tag, color, bgColor } = getTypeTag(item.def);
              return (
                <Command.Item
                  key={`def:${item.path}`}
                  value={`def:${item.path} ${item.name} ${item.namespace}`}
                  onSelect={() => handleSelectDef(item.path)}
                  className={itemStyle}
                >
                  <span
                    style={{ color, backgroundColor: bgColor }}
                    className={tagStyle}
                  >
                    {tag}
                  </span>
                  <span className={css({ flex: 1, fontWeight: "500" })}>
                    {item.name}
                  </span>
                  <span className={pathStyle}>{item.namespace}</span>
                </Command.Item>
              );
            })}
          </Command.Group>
        )}
      </Command.List>

      <div className={footerStyle}>
        <span className={hstack({ gap: "1" })}>
          <kbd className={kbdStyle}>↑↓</kbd>
          navigate
        </span>
        <span className={hstack({ gap: "1" })}>
          <kbd className={kbdStyle}>↵</kbd>
          select
        </span>
        <span className={hstack({ gap: "1" })}>
          <kbd className={kbdStyle}>esc</kbd>
          close
        </span>
      </div>
    </Command.Dialog>
  );
};

// ============================================================================
// Internal Components
// ============================================================================

const FileIcon = () => (
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
      fill="var(--colors-file-fill)"
      stroke="var(--colors-file-stroke)"
      strokeWidth="1"
    />
    <path d="M14 2V8H20" stroke="var(--colors-file-stroke)" strokeWidth="1" />
  </svg>
);

// ============================================================================
// Styles
// ============================================================================

const dialogStyle = css({
  position: "fixed",
  top: "20%",
  left: "50%",
  transform: "translateX(-50%)",
  width: "100%",
  maxWidth: "640px",
  bg: "white",
  borderRadius: "xl",
  boxShadow: "dialog",
  border: "1px solid #E8E4DE",
  overflow: "hidden",
  zIndex: 1000,
});

const overlayStyle = css({
  position: "fixed",
  inset: 0,
  bg: "overlay",
  zIndex: 999,
});

const inputStyle = css({
  width: "100%",
  px: "4",
  py: "4",
  fontSize: "md",
  border: "none",
  borderBottom: "1px solid #E8E4DE",
  outline: "none",
  bg: "transparent",
  color: "text",
  _placeholder: { color: "text.placeholder" },
});

const listStyle = css({
  maxHeight: "400px",
  overflowY: "auto",
  p: "2",
});

const emptyStyle = css({
  py: "6",
  textAlign: "center",
  color: "text.placeholder",
  fontSize: "sm",
});

const groupStyle = css({
  "& [cmdk-group-heading]": {
    px: "2",
    py: "1.5",
    fontSize: "xs",
    fontWeight: "600",
    color: "text.muted",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
});

const itemStyle = css({
  display: "flex",
  alignItems: "center",
  gap: "3",
  px: "3",
  py: "2",
  borderRadius: "lg",
  cursor: "pointer",
  color: "text.secondary",
  fontSize: "sm",
  transition: "all 0.1s ease",
  "&[data-selected=true]": {
    bg: "accent.light",
    color: "accent",
  },
});

const defCountStyle = css({
  fontSize: "xs",
  color: "text.placeholder",
});

const pathStyle = css({
  fontSize: "xs",
  color: "text.placeholder",
  fontFamily: "mono",
});

const tagStyle = css({
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
});

const footerStyle = css({
  px: "3",
  py: "2",
  borderTop: "1px solid #E8E4DE",
  display: "flex",
  alignItems: "center",
  gap: "4",
  fontSize: "xs",
  color: "text.placeholder",
});

const kbdStyle = css({
  px: "1.5",
  py: "0.5",
  bg: "bg.muted",
  borderRadius: "sm",
  fontFamily: "mono",
});
