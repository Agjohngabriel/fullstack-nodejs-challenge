import React, { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

const PeptideSuggestionsApp = () => {
  const [formData, setFormData] = useState({
    age: '',
    healthGoal: ''
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const healthGoals = [
    { value: 'energy', label: 'Energy & Vitality' },
    { value: 'sleep', label: 'Better Sleep' },
    { value: 'focus', label: 'Mental Focus' },
    { value: 'recovery', label: 'Muscle Recovery' },
    { value: 'longevity', label: 'Anti-Aging' }
  ];

  const validateForm = () => {
    if (!formData.age) {
      setError('Age is required');
      return false;
    }
    
    const ageNum = parseInt(formData.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
      setError('Please enter a valid age between 18 and 120');
      return false;
    }

    if (!formData.healthGoal) {
      setError('Please select a health goal');
      return false;
    }

    return true;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch('http://localhost:3001/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: parseInt(formData.age),
          goal: formData.healthGoal
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get suggestions');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setSuccess(true);
      
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Unable to connect to server. Please make sure the backend is running on port 3001.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ age: '', healthGoal: '' });
    setSuggestions([]);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🧬 Peptide Suggestions
          </h1>
          <p className="text-gray-600">
            Get personalized peptide recommendations based on your health goals
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="space-y-6">
            {/* Age Input */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="Enter your age"
                min="18"
                max="120"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={loading}
              />
            </div>

            {/* Health Goal Dropdown */}
            <div>
              <label htmlFor="healthGoal" className="block text-sm font-medium text-gray-700 mb-2">
                Health Goal
              </label>
              <select
                id="healthGoal"
                name="healthGoal"
                value={formData.healthGoal}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                disabled={loading}
              >
                <option value="">Select your primary health goal</option>
                {healthGoals.map(goal => (
                  <option key={goal.value} value={goal.value}>
                    {goal.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Getting Suggestions...
                </>
              ) : (
                'Get Peptide Suggestions'
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && suggestions.length > 0 && (
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 mb-6">
            <CheckCircle size={20} />
            <span>Successfully retrieved {suggestions.length} personalized suggestions!</span>
          </div>
        )}

        {/* Suggestions Results */}
        {suggestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Your Personalized Suggestions
              </h2>
              <button
                onClick={resetForm}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                New Search
              </button>
            </div>
            
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">
                    {suggestion.name}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                  {suggestion.dosage && (
                    <div className="mt-2 text-sm text-blue-600">
                      <strong>Suggested Dosage:</strong> {suggestion.dosage}
                    </div>
                  )}
                  {suggestion.timing && (
                    <div className="mt-1 text-sm text-blue-600">
                      <strong>Best Time:</strong> {suggestion.timing}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Disclaimer:</strong> These suggestions are for informational purposes only. 
                Always consult with a healthcare professional before starting any new supplement regimen.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by AI-driven peptide research and recommendations</p>
        </div>
      </div>
    </div>
  );
};

export default PeptideSuggestionsApp;