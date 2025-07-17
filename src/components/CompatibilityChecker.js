/**
 * Compatibility Checker Component
 * Comprehensive testing and compatibility validation
 */
import React, { useState, useEffect } from 'react';
import { compatibilityTester, crossPlatformOptimizer } from '../utils/deviceDetection.js';

const CompatibilityChecker = ({ 
  autoRun = true,
  showResults = process.env.NODE_ENV === 'development',
  onResults = null,
  children 
}) => {
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (autoRun) {
      runCompatibilityTests();
    }
    
    // Apply cross-platform optimizations
    crossPlatformOptimizer.applyOptimizations();
  }, [autoRun]);

  const runCompatibilityTests = async () => {
    setIsRunning(true);
    
    try {
      // Run compatibility tests
      const testResults = compatibilityTester.runCompatibilityTests();
      setResults(testResults);
      
      // Report results to callback
      if (onResults) {
        onResults(testResults);
      }
      
      // Log results in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🔍 Compatibility Test Results');
        console.log('Overall Score:', testResults.overall.score);
        console.log('Rating:', testResults.overall.rating);
        console.log('Browser:', testResults.browser.name, testResults.browser.version);
        console.log('Device:', testResults.device.type, testResults.device.os);
        console.log('Performance Level:', testResults.device.performance.level);
        
        // Log issues
        const allIssues = [
          ...testResults.tests.browser.issues,
          ...testResults.tests.features.missing,
          ...testResults.tests.performance.issues,
          ...testResults.tests.accessibility.issues
        ];
        
        if (allIssues.length > 0) {
          console.warn('Issues found:', allIssues);
        }
        
        console.groupEnd();
      }
    } catch (error) {
      console.error('Compatibility testing failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingIcon = (rating) => {
    switch (rating) {
      case 'excellent': return '🟢';
      case 'good': return '🔵';
      case 'fair': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
    }
  };

  if (!showResults) {
    return children;
  }

  return (
    <>
      {children}
      
      {/* Compatibility Results Overlay */}
      {results && (
        <div className="fixed top-4 left-4 z-50 max-w-sm">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Compatibility</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                {showDetails ? 'Hide' : 'Details'}
              </button>
            </div>
            
            {/* Overall Score */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{getRatingIcon(results.overall.rating)}</span>
              <span className={`font-bold ${getScoreColor(results.overall.score)}`}>
                {results.overall.score}/100
              </span>
              <span className="text-sm text-gray-600 capitalize">
                {results.overall.rating}
              </span>
            </div>
            
            <p className="text-xs text-gray-600 mb-3">
              {results.overall.recommendation}
            </p>
            
            {/* Detailed Results */}
            {showDetails && (
              <div className="space-y-3 border-t pt-3">
                {/* Browser Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Browser</h4>
                  <div className="text-xs text-gray-600">
                    {results.browser.name} {results.browser.version}
                    {!results.browser.isModern && (
                      <span className="text-red-500 ml-1">(Outdated)</span>
                    )}
                  </div>
                  <div className={`text-xs ${getScoreColor(results.tests.browser.score)}`}>
                    Score: {results.tests.browser.score}/100
                  </div>
                </div>
                
                {/* Device Info */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Device</h4>
                  <div className="text-xs text-gray-600">
                    {results.device.type} • {results.device.os}
                  </div>
                  <div className="text-xs text-gray-600">
                    Performance: {results.device.performance.level}
                  </div>
                </div>
                
                {/* Feature Support */}
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Features</h4>
                  <div className={`text-xs ${getScoreColor(results.tests.features.score)}`}>
                    Score: {results.tests.features.score}/100
                  </div>
                  {results.tests.features.missing.length > 0 && (
                    <div className="text-xs text-red-500">
                      Missing: {results.tests.features.missing.join(', ')}
                    </div>
                  )}
                </div>
                
                {/* Issues */}
                {(results.tests.browser.issues.length > 0 || 
                  results.tests.performance.issues.length > 0 || 
                  results.tests.accessibility.issues.length > 0) && (
                  <div>
                    <h4 className="font-medium text-sm text-red-700 mb-1">Issues</h4>
                    <div className="text-xs text-red-600 space-y-1">
                      {[...results.tests.browser.issues, 
                        ...results.tests.performance.issues, 
                        ...results.tests.accessibility.issues].map((issue, index) => (
                        <div key={index}>• {issue}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Warnings */}
                {(results.tests.browser.warnings.length > 0 || 
                  results.tests.performance.warnings.length > 0 || 
                  results.tests.accessibility.warnings.length > 0) && (
                  <div>
                    <h4 className="font-medium text-sm text-yellow-700 mb-1">Warnings</h4>
                    <div className="text-xs text-yellow-600 space-y-1">
                      {[...results.tests.browser.warnings, 
                        ...results.tests.performance.warnings, 
                        ...results.tests.accessibility.warnings].map((warning, index) => (
                        <div key={index}>• {warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button
                onClick={runCompatibilityTests}
                disabled={isRunning}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isRunning ? 'Testing...' : 'Retest'}
              </button>
              <button
                onClick={() => setResults(null)}
                className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompatibilityChecker;