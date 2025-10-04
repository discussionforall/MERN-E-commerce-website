// Navigation utility for use outside of React components
let navigateFunction:
  | ((path: string, options?: { replace?: boolean }) => void)
  | null = null;

export const setNavigateFunction = (
  navigate: (path: string, options?: { replace?: boolean }) => void
) => {
  navigateFunction = navigate;
};

export const navigateTo = (path: string, options?: { replace?: boolean }) => {
  if (navigateFunction) {
    navigateFunction(path, options);
  } else {
    // Fallback to window.location if navigate function is not available
    window.location.href = path;
  }
};
