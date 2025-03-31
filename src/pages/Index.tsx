import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Upload, Search, Heart, Sparkles, ArrowRight, Store } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import { cn } from '@/lib/utils';

const FeatureCard = ({
  icon,
  title,
  description,
  className
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) => (
  <div className={cn(
    "rounded-2xl p-8 bg-white border border-thrift-100 shadow-sm transition-all duration-300 hover:shadow-md",
    className
  )}>
    <div className="w-12 h-12 rounded-full bg-thrift-100 flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-xl font-medium text-thrift-900 mb-2">{title}</h3>
    <p className="text-thrift-600">{description}</p>
  </div>
);

const Testimonial = ({
  quote,
  author,
  role,
  className
}: {
  quote: string;
  author: string;
  role: string;
  className?: string;
}) => (
  <div className={cn(
    "rounded-2xl p-8 bg-white border border-thrift-100 shadow-sm hover:shadow-md transition-all duration-300",
    className
  )}>
    <div className="mb-4">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="text-yellow-400 text-lg">★</span>
      ))}
    </div>
    <p className="text-thrift-700 italic mb-6">{quote}</p>
    <div>
      <p className="font-medium text-thrift-900">{author}</p>
      <p className="text-sm text-thrift-500">{role}</p>
    </div>
  </div>
);

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Hero />

      {/* Hero Content Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="mt-6 text-3xl md:text-4xl font-bold text-thrift-900">
              Find the best deals on secondhand & vintage fashion!
              </h2>
              <p className="mt-4 text-thrift-600 text-lg">
                Whether you're a retailer looking to reach more customers or a shopper searching for specific second-hand items,
                our platform makes the connection simple and effective.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <div className="mt-1.5 mr-3 text-thrift-600">✓</div>
                  <p className="text-thrift-700">Image recognition to extract item details automatically</p>
                </div>
                <div className="flex items-start">
                  <div className="mt-1.5 mr-3 text-thrift-600">✓</div>
                  <p className="text-thrift-700">Get notifications when wishlist items become available</p>
                </div>
                <div className="flex items-start">
                  <div className="mt-1.5 mr-3 text-thrift-600">✓</div>
                  <p className="text-thrift-700">Support local businesses and reduce fashion waste</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-thrift-100 to-thrift-50 opacity-20 blur-3xl rounded-full"></div>
              <img
                src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
                alt="Sustainable fashion"
                className="w-full h-auto rounded-2xl relative z-10 shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-thrift-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="bg-thrift-900/5 text-thrift-700 text-sm font-medium px-4 py-2 rounded-full">
              How It Works
            </span>
            <h2 className="mt-6 text-3xl md:text-4xl font-bold text-thrift-900">
              Connect, Discover, and Thrift
            </h2>
            <p className="mt-4 text-thrift-600 max-w-2xl mx-auto text-lg">
              Our platform bridges the gap between second-hand retailers and conscious shoppers,
              making sustainable fashion accessible to everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Upload size={24} className="text-thrift-700" />}
              title="Retailers Upload Merchandise"
              description="Second-hand stores can easily upload and manage their inventory with our image recognition technology."
            />
            <FeatureCard
              icon={<Heart size={24} className="text-thrift-700" />}
              title="Users Create Wishlists"
              description="Shoppers can create personalized wishlists of items they're looking for in the second-hand market."
            />
            <FeatureCard
              icon={<Sparkles size={24} className="text-thrift-700" />}
              title="Smart Matching"
              description="Our system intelligently connects wishlist items with available inventory, notifying users of matches."
            />
          </div>
        </div>
      </section>

      {/* User Options Section */}
      <section className="py-20 bg-white">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-thrift-900">
              Join the sustainable fashion movement
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customer View */}
            <div className="bg-white rounded-2xl shadow-sm p-10 hover:shadow-md transition-all duration-300 border border-thrift-100">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-thrift-100 rounded-xl flex items-center justify-center mb-6">
                  <ShoppingBag className="h-7 w-7 text-thrift-700" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                <button
                    onClick={() => navigate('/new')}
                    className="w-full bg-thrift-600 text-white py-4 px-6 rounded-xl hover:bg-thrift-700 transition-colors font-medium"
                  >
                   Shop PreLoved Items
                  </button>
                  
                </h2>
                <p className="text-gray-600 mb-8">
                  Browse our curated collection of vintage and second-hand clothing.
                </p>
              </div>
            </div>
            {/* Company View */}
            <div className="bg-white rounded-2xl shadow-sm p-10 hover:shadow-md transition-all duration-300 border border-thrift-100">
              <div className="text-center">
                <div className="mx-auto w-14 h-14 bg-thrift-100 rounded-xl flex items-center justify-center mb-6">
                  <Store className="h-7 w-7 text-thrift-700" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                <button
                    onClick={() => navigate('/retail')}
                    className="w-full bg-thrift-600 text-white py-4 px-6 rounded-xl hover:bg-thrift-700 transition-colors font-medium"
                  >
                    Manage Retail Hub
                  </button>
                  
                </h2>
                <p className="text-gray-600 mb-8">
                  Manage your inventory, upload new items, and uncover emerging buyer and product trends.
                </p>
              </div>
            </div>

            
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-thrift-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="bg-thrift-900/5 text-thrift-700 text-sm font-medium px-4 py-2 rounded-full">
              Testimonials
            </span>
            <h2 className="mt-6 text-3xl md:text-4xl font-bold text-thrift-900">
              What Our Users Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Testimonial
              quote="As a vintage store owner, this platform has helped me reach customers who are specifically looking for the items I have in stock."
              author="Sarah Johnson"
              role="RetroFinds Vintage"
              className="md:transform md:translate-y-8"
            />
            <Testimonial
              quote="I've been looking for a specific style of leather jacket for months. Within a week of adding it to my wishlist, I got notified about a perfect match!"
              author="Michael Chen"
              role="Fashion Enthusiast"
            />
            <Testimonial
              quote="The image recognition feature saves so much time in cataloging our inventory. It's a game-changer for small businesses like ours."
              author="Emily Rodriguez"
              role="EcoCloset Store Manager"
              className="md:transform md:translate-y-8"
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
