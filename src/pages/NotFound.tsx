import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-16">
        <div className="max-w-md w-full mx-auto text-center px-4">
          <h1 className="text-6xl font-serif font-bold text-thrift-900">404</h1>
          <div className="w-16 h-1 bg-thrift-600 mx-auto my-6"></div>
          <h2 className="text-2xl font-medium text-thrift-800 mb-4">Page Not Found</h2>
          <p className="text-thrift-600 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => navigate('/')}
              className="bg-thrift-600 text-white py-2 px-6 rounded-lg hover:bg-thrift-700 transition-colors font-medium"
            >
              Go Home
            </button>
            <button
              onClick={() => navigate(-1)}
              className="border border-thrift-200 text-thrift-700 py-2 px-6 rounded-lg hover:bg-thrift-50 transition-colors font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
