import React, { useState, useEffect } from 'react';
import { 
  getStatsSummary, 
  getVerbsByPerformance, 
  getVerbsNeedingPractice, 
  getWellKnownVerbs,
  clearStats,
  exportStats 
} from './puzzleStats';

/**
 * Statistics Display Component
 * Shows user performance metrics and verb rankings
 */
const StatsDisplay = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null);
  const [currentView, setCurrentView] = useState('summary'); // 'summary', 'all', 'practice', 'known'

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = () => {
    const summary = getStatsSummary();
    setStats(summary);
  };

  const handleClearStats = () => {
    if (window.confirm('Are you sure you want to clear all statistics? This action cannot be undone.')) {
      clearStats();
      loadStats();
    }
  };

  const handleExportStats = () => {
    exportStats();
  };

  const formatTime = (seconds) => {
    return `${seconds.toFixed(1)}s`;
  };

  const formatAccuracy = (correct, total) => {
    if (total === 0) return '0%';
    return `${Math.round((correct / total) * 100)}%`;
  };

  const renderVerbList = (verbs, title) => {
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-lg">{title}</h4>
        {verbs.length === 0 ? (
          <p className="text-gray-500 italic">No data available yet</p>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {verbs.map((verb, index) => (
              <div key={verb.verbId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <div className="flex-1">
                  <span className="font-medium">{verb.verbEng}</span>
                  <span className="text-gray-600 ml-2">({verb.verbChat})</span>
                </div>
                <div className="text-right text-sm">
                  <div>Avg: {formatTime(verb.averageTime)}</div>
                  <div className="text-gray-500">
                    {formatAccuracy(verb.correctAnswers, verb.attempts)} 
                    ({verb.correctAnswers}/{verb.attempts})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">📊 Puzzle Game Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {!stats ? (
            <div className="text-center py-8">Loading statistics...</div>
          ) : (
            <>
              {/* Summary Section */}
              {currentView === 'summary' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalVerbs}</div>
                      <div className="text-sm text-blue-800">Words Practiced</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
                      <div className="text-sm text-green-800">Correct Answers</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{formatAccuracy(stats.totalCorrect, stats.totalAttempts)}</div>
                      <div className="text-sm text-yellow-800">Accuracy</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{formatTime(stats.averageTime)}</div>
                      <div className="text-sm text-purple-800">Avg Time</div>
                    </div>
                  </div>

                  {/* Quick Lists */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {renderVerbList(getWellKnownVerbs(5), "🌟 Best Performance (Top 5)")}
                    </div>
                    <div className="space-y-4">
                      {renderVerbList(getVerbsNeedingPractice(5), "🎯 Need Practice (Bottom 5)")}
                    </div>
                  </div>
                </div>
              )}

              {/* All Verbs View */}
              {currentView === 'all' && (
                <div>
                  {renderVerbList(getVerbsByPerformance(), "All Verbs (Easiest to Hardest)")}
                </div>
              )}

              {/* Practice View */}
              {currentView === 'practice' && (
                <div>
                  {renderVerbList(getVerbsNeedingPractice(20), "Words Needing Practice")}
                </div>
              )}

              {/* Well Known View */}
              {currentView === 'known' && (
                <div>
                  {renderVerbList(getWellKnownVerbs(20), "Well-Known Words")}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex flex-wrap justify-between items-center gap-2">
            {/* View Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('summary')}
                className={`px-3 py-1 rounded text-sm ${currentView === 'summary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Summary
              </button>
              <button
                onClick={() => setCurrentView('all')}
                className={`px-3 py-1 rounded text-sm ${currentView === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                All Words
              </button>
              <button
                onClick={() => setCurrentView('practice')}
                className={`px-3 py-1 rounded text-sm ${currentView === 'practice' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Need Practice
              </button>
              <button
                onClick={() => setCurrentView('known')}
                className={`px-3 py-1 rounded text-sm ${currentView === 'known' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Well Known
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={handleExportStats}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                📥 Export
              </button>
              <button
                onClick={handleClearStats}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                🗑️ Clear All
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;