import { css } from "../../../styled-system/css";

// ============================================================================
// Exported Components
// ============================================================================

export const FolderClosedIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
  >
    <path
      d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"
      fill="var(--colors-folder-closed)"
      stroke="var(--colors-folder-stroke)"
      strokeWidth="1"
    />
  </svg>
);

export const FolderOpenIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
  >
    <path
      d="M5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z"
      fill="var(--colors-folder-open)"
      stroke="var(--colors-folder-stroke)"
      strokeWidth="1"
    />
    <path d="M3 10H21" stroke="var(--colors-folder-stroke)" strokeWidth="1" />
  </svg>
);

export const FileIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
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

export const GithubIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12C2 16.418 4.865 20.166 8.839 21.489C9.339 21.579 9.521 21.269 9.521 21.004C9.521 20.769 9.512 20.098 9.508 19.225C6.726 19.825 6.139 17.843 6.139 17.843C5.685 16.673 5.029 16.364 5.029 16.364C4.121 15.749 5.098 15.761 5.098 15.761C6.101 15.831 6.629 16.787 6.629 16.787C7.521 18.314 8.97 17.872 9.539 17.615C9.631 16.966 9.889 16.525 10.175 16.274C7.955 16.02 5.62 15.162 5.62 11.314C5.62 10.204 6.009 9.293 6.649 8.575C6.546 8.321 6.203 7.308 6.747 5.927C6.747 5.927 7.586 5.658 9.497 6.943C10.294 6.721 11.147 6.61 12 6.606C12.853 6.61 13.706 6.721 14.504 6.943C16.414 5.658 17.252 5.927 17.252 5.927C17.797 7.308 17.454 8.321 17.351 8.575C17.992 9.293 18.38 10.204 18.38 11.314C18.38 15.172 16.041 16.017 13.813 16.268C14.172 16.579 14.493 17.193 14.493 18.128C14.493 19.477 14.481 20.564 14.481 21.004C14.481 21.271 14.661 21.584 15.169 21.488C19.138 20.163 22 16.417 22 12C22 6.477 17.523 2 12 2Z"
      fill="currentColor"
    />
  </svg>
);

export const MenuIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
  >
    <path
      d="M3 12H21M3 6H21M3 18H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const CloseIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={iconStyle}
  >
    <path
      d="M18 6L6 18M6 6L18 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ============================================================================
// Styles
// ============================================================================

const iconStyle = css({ flexShrink: 0 });
