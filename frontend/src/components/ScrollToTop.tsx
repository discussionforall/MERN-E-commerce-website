import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll to top when pathname or search params change
    // Use setTimeout to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth', // Smooth scrolling animation
      });
    }, 100); // Small delay to ensure page content is loaded

    // Cleanup timer on unmount
    return () => clearTimeout(timer);
  }, [pathname, search]);

  // Also handle browser back/forward button
  useEffect(() => {
    const handlePopState = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      });
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
