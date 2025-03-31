import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-thrift-50 py-12 px-4 border-t border-thrift-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link to="/" className="flex items-center font-display text-2xl font-bold tracking-tight">
              <img 
                src="/Favicon@2x.png" 
                alt="Preloved Guru" 
                className="h-12"
              />
            </Link>
            <p className="mt-4 text-sm text-thrift-600 max-w-xs">
              Connecting second-hand retailers to customers, making sustainable shopping easier.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-medium text-thrift-900 mb-3">Navigation</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/new" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link to="/retail" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Retail Hub
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-thrift-900 mb-3">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-sm text-thrift-600 hover:text-thrift-900 transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-thrift-900 mb-3">Subscribe</h3>
            <p className="text-sm text-thrift-600 mb-3">
              Get notified about new items that match your wishlist
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="flex-grow p-2 text-sm border border-thrift-200 rounded-l-md focus:outline-none focus:ring-1 focus:ring-wish-500 focus:border-transparent"
              />
              <button className="bg-thrift-800 text-white px-4 py-2 rounded-r-md hover:bg-thrift-700 transition-colors text-sm">
                Subscribe
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-thrift-200 flex flex-col md:flex-row justify-between items-center text-sm text-thrift-500">
          <p>
            &copy; {new Date().getFullYear()} PrelovedGuru. All rights reserved.
          </p>
          <div className="flex items-center mt-4 md:mt-0">
            <span>Made with</span>
            <Heart size={14} className="mx-1 text-wish-500" />
            <span>for sustainable fashion</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
