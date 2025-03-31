import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current || !textRef.current) return;
      
      // Parallax effect
      const scrollY = window.scrollY;
      const opacity = 1 - Math.min(1, scrollY / 600);
      const translateY = scrollY * 0.4;
      
      textRef.current.style.opacity = `${opacity}`;
      textRef.current.style.transform = `translateY(${translateY}px)`;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={heroRef}
      className="relative h-[20vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-thrift-50"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-thrift-300 to-transparent opacity-30"></div>
        <div className="h-full w-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PGcgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSI+PHBhdGggZD0iTTggMzJoNDRNMzIgOHY0NCIvPjwvZz48L3N2Zz4=')]"></div>
      </div>

      {/* Content */}
      <div 
        ref={textRef}
        className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center -mt-16"
      >
        <div className="inline-block animate-fade-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <span className="bg-thrift-900/5 text-thrift-700 text-xs font-medium px-3 py-1 rounded-full">
            Connect Retailers & Wishlists
          </span>
        </div>
        
        <h1 className="mt-4 font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-thrift-900 animate-fade-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          Discover Second-Hand
          <span className="block mt-2 text-wish-700">Treasures</span>
        </h1>
        
        <p className="mt-4 text-thrift-600 text-lg md:text-xl max-w-2xl mx-auto animate-fade-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          Connect with local retailers, find unique pre-loved items, and match your wishlist with available catalogs.
        </p>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
          <Link 
            to="/catalog" 
            className="btn-primary rounded-full py-4 px-8 bg-thrift-900 hover:bg-thrift-800 transition-all duration-300 group"
          >
            <span>Browse Catalog</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          
          <Link 
            to="/upload" 
            className="btn-secondary rounded-full py-4 px-8 hover:bg-thrift-200 transition-all duration-300"
          >
            Upload Items
          </Link>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce opacity-50">
        <div className="w-6 h-10 border-2 border-thrift-400 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-thrift-500 rounded-full mt-2 animate-float"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
