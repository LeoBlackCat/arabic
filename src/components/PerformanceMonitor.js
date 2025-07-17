/**
 * Performance Monitor Component
 * Real-time performance monitoring and optimization
 */
import React, { useEffect, useState, useRef } from 'react';
import { performanceMonitor, performanceBudget, animationOptimizer } from '../utils/performanceUtils.js';

const PerformanceMonitor = ({ 
  enabled = process.env.NODE_ENV === 'development',
  showFPS = false,
  onPerformanceIssue = null,
  children 
}) => {
  const [fps, setFPS] = useState(60);
  const [performanceIssues, setPerformanceIssues] = useState([]);
  const [webVitals, setWebVitals] = useState({});
  const monitoringRef = useRef(false);

  useEffect(() => {
    if (!enabled || monitoringRef.current) return;
    
    monitoringRef.current = true;

    // Monitor frame rate
    if (showFPS) {
      animationOptimizer.monitorAnimationPerformance((currentFPS) => {
        setFPS(currentFPS);
        
        if (currentFPS < 30 && onPerformanceIssue) {
          onPerformanceIssue({
            type: 'low-fps',
            value: currentFPS,
            message: 'Low frame rate detected'
          });
        }
      });
    }

    // Detect performance issues
    const issues = performanceMonitor.detectPerformanceIssues();
    setPerformanceIssues(issues);

    // Monitor Web Vitals
    performanceBudget.monitorWebVitals((vital) => {
      setWebVitals(prev => ({
        ...prev,
        [vital.name]: vital
      }));

      if (vital.rating === 'poor' && onPerformanceIssue) {
        onPerformanceIssue({
          type: 'web-vital',
          metric: vital.name,
          value: vital.value,
          rating: vital.rating,
          message: `Poor ${vital.name}: ${vital.value}ms`
        });
      }
    });

    return () => {
      monitoringRef.current = false;
    };
  }, [enabled, showFPS, onPerformanceIssue]);

  // Don't render anything in production unless explicitly enabled
  if (!enabled) {
    return children;
  }

  return (
    <>
      {children}
      
      {/* Performance Overlay */}
      <div className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div className="bg-black/80 text-white text-xs p-2 rounded-lg font-mono space-y-1">
          {showFPS && (
            <div className={`flex items-center gap-2 ${fps < 30 ? 'text-red-400' : fps < 50 ? 'text-yellow-400' : 'text-green-400'}`}>
              <span>FPS:</span>
              <span className="font-bold">{fps}</span>
            </div>
          )}
          
          {performanceIssues.length > 0 && (
            <div className="text-yellow-400">
              <div>Issues:</div>
              {performanceIssues.map((issue, index) => (
                <div key={index} className="ml-2">• {issue}</div>
              ))}
            </div>
          )}
          
          {Object.keys(webVitals).length > 0 && (
            <div className="border-t border-gray-600 pt-1 mt-1">
              <div className="text-gray-300">Web Vitals:</div>
              {Object.entries(webVitals).map(([name, vital]) => (
                <div key={name} className={`ml-2 ${
                  vital.rating === 'good' ? 'text-green-400' : 
                  vital.rating === 'needs-improvement' ? 'text-yellow-400' : 
                  'text-red-400'
                }`}>
                  {name}: {Math.round(vital.value)}ms
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PerformanceMonitor;