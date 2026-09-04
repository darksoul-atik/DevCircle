import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [health, setHealth] = useState<string>('Checking backend health...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('http://localhost:3000/health');
        if (response.data.success) {
          setHealth(`Backend is healthy: ${response.data.message}`);
        } else {
          setHealth('Backend returned unexpected response');
        }
      } catch (err: any) {
        setHealth(`Backend health check failed: ${err.message}`);
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          DevCircle
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Welcome to the developer community.
        </p>
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
          <code className="text-sm text-purple-600 dark:text-purple-400 font-mono">
            {health}
          </code>
        </div>
      </div>
    </div>
  );
}

export default App;
