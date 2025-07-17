/**
 * Lazy Component Wrapper
 * Optimized lazy loading with error boundaries and fallbacks
 */
import React, { Suspense, useState, useEffect } from 'react';
import { SkeletonLoader, Spinner } from './LoadingStates.js';

/**
 * Error Boundary for Lazy Components
 */
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy component loading error:', error, errorInfo);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production' && this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center text-neutral-600">
          <div className="text-lg mb-2">⚠️ Component failed to load</div>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn btn-primary btn-sm"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy Component Wrapper
 */
const LazyComponent = ({
  component: Component,
  fallback = null,
  errorFallback = null,
  loadingType = 'spinner', // 'spinner', 'skeleton', 'custom'
  onError = null,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  // Intersection Observer for viewport-based loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setIsVisible(true);
          setHasIntersected(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.querySelector(`[data-lazy-id="${Math.random()}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [hasIntersected]);

  const renderFallback = () => {
    if (fallback) return fallback;
    
    switch (loadingType) {
      case 'skeleton':
        return (
          <div className="space-y-3">
            <SkeletonLoader height="2rem" />
            <SkeletonLoader height="1rem" width="80%" />
            <SkeletonLoader height="1rem" width="60%" />
          </div>
        );
      case 'custom':
        return <div className="animate-pulse bg-neutral-100 rounded h-32" />;
      default:
        return (
          <div className="flex items-center justify-center p-8">
            <Spinner size="medium" />
          </div>
        );
    }
  };

  return (
    <div className={className} data-lazy-id={Math.random()}>
      <LazyErrorBoundary fallback={errorFallback} onError={onError}>
        {isVisible ? (
          <Suspense fallback={renderFallback()}>
            <Component {...props} />
          </Suspense>
        ) : (
          renderFallback()
        )}
      </LazyErrorBoundary>
    </div>
  );
};

export default LazyComponent;