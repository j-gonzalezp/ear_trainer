"use client";
import { useState, useEffect } from 'react';
import { rhythmGenerator } from '@/lib/generators';

// Helper function to validate the rhythm 
const validateRhythm = (rhythm, expectedBeats) => {
  if (!rhythm || rhythm.length === 0) {
    return { 
      valid: false, 
      totalBeats: 0, 
      expectedBeats,
      notesCount: 0,
      restsCount: 0,
      totalEvents: 0,
      message: "Empty rhythm" 
    };
  }

  // Calculate total beats and count notes/rests
  let totalBeats = 0;
  let notesCount = 0;
  let restsCount = 0;

  rhythm.forEach(item => {
    totalBeats += item.value;
    if (item.type === "note") {
      notesCount++;
    } else if (item.type === "rest") {
      restsCount++;
    }
  });

  // Check if the total beats match the expected beats
  const beatsMatch = Math.abs(totalBeats - expectedBeats) < 0.001;
  
  return {
    valid: beatsMatch,
    totalBeats,
    expectedBeats,
    notesCount,
    restsCount,
    totalEvents: rhythm.length,
    message: beatsMatch ? "Valid rhythm" : "Total beats don't match expected beats"
  };
};

const page = () => {
 
    const [testResults, setTestResults] = useState([]);
    const [loaded, setLoaded] = useState(false);
    
    // Run tests when the page loads
    useEffect(() => {
      if (!loaded) {
        runTests();
        setLoaded(true);
      }
    }, [loaded]);
    
    // Function to run the tests
    const runTests = () => {
      const results = [];
      
      // Duration map for reference
      const durationMap = {
        "32n": 1/8,
        "16n": 1/4,
        "8n": 1/2,
        "4n": 1,
        "2n": 2,
        "1n": 4
      };
      
      for (let i = 0; i < 20; i++) {
        try {
          // Generate random configuration to test various cases
          const config = {
            totalBeats: Math.floor(Math.random() * 8) + 2, // 2-10 beats
            shortestDuration: ["16n", "8n", "4n"][Math.floor(Math.random() * 3)],
            longestDuration: ["4n", "2n", "1n"][Math.floor(Math.random() * 3)],
            n: Math.floor(Math.random() * 8) + 2, // 2-10 notes (not events)
            allowRests: Math.random() > 0.5,
            restProbability: Math.random() * 0.5
          };
          
          // Make sure shortestDuration < longestDuration
          const durations = ["16n", "8n", "4n", "2n", "1n"];
          const shortIndex = durations.indexOf(config.shortestDuration);
          const longIndex = durations.indexOf(config.longestDuration);
          
          if (shortIndex > longIndex) {
            const temp = config.shortestDuration;
            config.shortestDuration = config.longestDuration;
            config.longestDuration = temp;
          }
          
          // Generate rhythm with current configuration
          const rhythm = rhythmGenerator(config);
          
          // Validate the generated rhythm
          const validation = validateRhythm(rhythm, config.totalBeats);
          
          // Check if we have exactly n notes (not counting rests)
          const hasCorrectNotesCount = validation.notesCount === config.n;
  
          // Add custom validation to check if we have exactly n notes
          validation.valid = validation.valid && hasCorrectNotesCount;
          if (!hasCorrectNotesCount) {
            validation.message = `Expected ${config.n} notes but got ${validation.notesCount}`;
          }
          
          // Add the result
          results.push({
            testId: i + 1,
            config,
            rhythm,
            validation,
            error: null
          });
        } catch (error) {
          results.push({
            testId: i + 1,
            config: {
              totalBeats: 4,
              shortestDuration: "8n",
              longestDuration: "2n",
              n: 4,
              allowRests: true,
              restProbability: 0.2
            },
            rhythm: null,
            validation: null,
            error: error.message
          });
        }
      }
      
      setTestResults(results);
    };
    
    // Calculate test statistics
    const successCount = testResults.filter(r => !r.error && r.validation?.valid).length;
    const failCount = testResults.length - successCount;
    
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Rhythm Generator Test (20 iterations)</h1>
        
        <div className="mb-6 p-4 bg-gray-100 rounded">
          <h2 className="text-xl font-semibold mb-2">General Results</h2>
          <p className="mb-2">Successful tests: <span className="font-bold text-green-600">{successCount}</span> / 20</p>
          <p className="mb-2">Failed tests: <span className="font-bold text-red-600">{failCount}</span> / 20</p>
          
          <div className="mt-4">
            <button 
              onClick={runTests}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Run Tests Again
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {testResults.map(result => (
            <div 
              key={result.testId} 
              className={`p-4 rounded border ${result.error || !result.validation?.valid ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}`}
            >
              <h3 className="font-bold">Test #{result.testId}</h3>
              
              {result.error ? (
                <div className="text-red-600 mt-2">
                  <p>Error: {result.error}</p>
                </div>
              ) : (
                <>
                  <div className="mt-2">
                    <p><span className="font-semibold">Total beats:</span> {result.config.totalBeats}</p>
                    <p><span className="font-semibold">Shortest duration:</span> {result.config.shortestDuration}</p>
                    <p><span className="font-semibold">Longest duration:</span> {result.config.longestDuration}</p>
                    <p><span className="font-semibold">Required notes (n):</span> {result.config.n}</p>
                    <p><span className="font-semibold">Allow rests:</span> {result.config.allowRests ? 'Yes' : 'No'}</p>
                    <p><span className="font-semibold">Rest probability:</span> {(result.config.restProbability * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="mt-2">
                    <p className="font-semibold">Results:</p>
                    <div className="overflow-auto max-h-40 bg-gray-50 p-2 rounded">
                      {result.rhythm.map((item, idx) => (
                        <p key={idx} className={item.type === "note" ? "text-blue-600" : "text-gray-600"}>
                          {idx+1}. {item.type}: {item.duration} ({item.value} beats)
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className={`font-semibold ${Math.abs(result.validation.totalBeats - result.validation.expectedBeats) < 0.001 ? 'text-green-600' : 'text-red-600'}`}>
                      Calculated beats: {result.validation.totalBeats.toFixed(2)} / {result.validation.expectedBeats} expected
                    </p>
                    <p className={`font-semibold ${result.validation.notesCount === result.config.n ? 'text-green-600' : 'text-red-600'}`}>
                      Notes: {result.validation.notesCount} / {result.config.n} required
                    </p>
                    <p>
                      Rests: {result.validation.restsCount}
                    </p>
                    <p>
                      Total events: {result.validation.totalEvents}
                    </p>
                    
                    {!result.validation.valid && (
                      <p className="text-red-600 font-semibold mt-2">
                        Validation failed: {result.validation.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
}

export default page