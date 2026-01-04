import { css } from "../../styled-system/css";

// ============================================================================
// Types
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

interface TabButtonGroupProps {
  children: React.ReactNode;
}

// ============================================================================
// Exported Components
// ============================================================================

export const TabButtonGroup = ({ children }: TabButtonGroupProps) => (
  <div className={tabGroupStyle}>{children}</div>
);

export const TabButton = ({ active, onClick, children }: TabButtonProps) => (
  <button onClick={onClick} className={tabButtonStyle(active)}>
    {children}
  </button>
);

// ============================================================================
// Styles
// ============================================================================

const tabGroupStyle = css({
  display: "flex",
  gap: "1",
  mb: "6",
  borderBottom: "1px solid #E8E4DE",
});

const tabButtonStyle = (active: boolean) =>
  css({
    px: "4",
    py: "2",
    fontSize: "sm",
    fontWeight: active ? "600" : "normal",
    color: active ? "accent" : "text.muted",
    borderBottom: "2px solid",
    borderColor: active ? "accent" : "transparent",
    cursor: "pointer",
    transition: "all 0.15s ease",
    mb: "-1px",
    _hover: { color: active ? "accent" : "text.secondary" },
  });
