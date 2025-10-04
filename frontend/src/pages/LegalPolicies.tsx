import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  FileText,
  Cookie,
  CheckCircle,
  Clock,
  Mail,
  ExternalLink,
} from 'lucide-react';

const LegalPolicies: React.FC = () => {
  const [activeSection, setActiveSection] = useState('privacy');
  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Track reading progress
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const scrollTop = window.scrollY;
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        setReadingProgress(Math.min(progress, 100));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle section navigation
  const scrollToSection = (sectionId: string) => {
    const element = sectionsRef.current[sectionId];
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setActiveSection(sectionId);
    }
  };

  // Intersection observer for active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-100px 0px -50% 0px',
      }
    );

    Object.values(sectionsRef.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const sections = [
    { id: 'privacy', title: 'Privacy Policy', icon: Shield },
    { id: 'terms', title: 'Terms of Service', icon: FileText },
    { id: 'cookies', title: 'Cookie Policy', icon: Cookie },
  ];

  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Progress Bar */}
      <div className='fixed top-0 left-0 w-full h-1 bg-gray-200 z-50'>
        <div
          className='h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300'
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <Link
            to='/products'
            className='inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors'
          >
            <ArrowLeft className='h-5 w-5 mr-2' />
            Back to Store
          </Link>

          <div className='text-center'>
            <h1 className='text-4xl font-bold text-gray-900 mb-4'>
              Legal Policies & Terms
            </h1>
            <p className='text-lg text-gray-600 max-w-3xl mx-auto'>
              Your privacy and rights are important to us. Please review our
              policies below.
            </p>
            <div className='flex items-center justify-center mt-4 text-sm text-gray-500'>
              <Clock className='h-4 w-4 mr-2' />
              Last updated: {lastUpdated}
            </div>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sticky Navigation */}
          <div className='lg:w-80 flex-shrink-0'>
            <div className='sticky top-24'>
              <div className='bg-white rounded-xl shadow-lg p-6'>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>
                  Navigate
                </h2>
                <nav className='space-y-2'>
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                          activeSection === section.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className='h-5 w-5 mr-3 flex-shrink-0' />
                        <span className='font-medium'>{section.title}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Contact Support */}
                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <h3 className='text-sm font-semibold text-gray-900 mb-3'>
                    Need Help?
                  </h3>
                  <Link
                    to='/contact'
                    className='inline-flex items-center text-sm text-blue-600 hover:text-blue-700 transition-colors'
                  >
                    <Mail className='h-4 w-4 mr-2' />
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className='flex-1' ref={contentRef}>
            <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
              {/* Privacy Policy */}
              <section
                id='privacy'
                ref={el => (sectionsRef.current.privacy = el as HTMLDivElement)}
                className='p-8 lg:p-12'
              >
                <div className='flex items-center mb-6'>
                  <Shield className='h-8 w-8 text-blue-600 mr-3' />
                  <h2 className='text-3xl font-bold text-gray-900'>
                    Privacy Policy
                  </h2>
                </div>

                <div className='prose prose-lg max-w-none'>
                  <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-8'>
                    <p className='text-blue-800 font-medium'>
                      We are committed to protecting your privacy and ensuring
                      the security of your personal information.
                    </p>
                  </div>

                  <div className='space-y-8'>
                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Information We Collect
                      </h3>
                      <div className='grid md:grid-cols-2 gap-6'>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Personal Information
                          </h4>
                          <ul className='text-gray-600 space-y-1 text-sm'>
                            <li>• Name and contact details</li>
                            <li>• Email address and phone number</li>
                            <li>• Shipping and billing addresses</li>
                            <li>• Payment information (securely processed)</li>
                          </ul>
                        </div>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Usage Information
                          </h4>
                          <ul className='text-gray-600 space-y-1 text-sm'>
                            <li>• Browsing and purchase history</li>
                            <li>• Device and browser information</li>
                            <li>• IP address and location data</li>
                            <li>• Cookies and tracking data</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        How We Use Your Information
                      </h3>
                      <div className='space-y-4'>
                        <div className='flex items-start'>
                          <CheckCircle className='h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              Order Processing
                            </h4>
                            <p className='text-gray-600'>
                              To process and fulfill your orders, send
                              confirmations, and handle returns.
                            </p>
                          </div>
                        </div>
                        <div className='flex items-start'>
                          <CheckCircle className='h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              Customer Support
                            </h4>
                            <p className='text-gray-600'>
                              To provide customer service and respond to your
                              inquiries.
                            </p>
                          </div>
                        </div>
                        <div className='flex items-start'>
                          <CheckCircle className='h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              Improve Our Services
                            </h4>
                            <p className='text-gray-600'>
                              To analyze usage patterns and enhance your
                              shopping experience.
                            </p>
                          </div>
                        </div>
                        <div className='flex items-start'>
                          <CheckCircle className='h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                          <div>
                            <h4 className='font-medium text-gray-900'>
                              Marketing
                            </h4>
                            <p className='text-gray-600'>
                              To send promotional offers and product updates
                              (with your consent).
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Data Security
                      </h3>
                      <div className='bg-green-50 border border-green-200 rounded-lg p-6'>
                        <div className='flex items-start'>
                          <Shield className='h-6 w-6 text-green-600 mr-3 mt-0.5 flex-shrink-0' />
                          <div>
                            <h4 className='font-medium text-green-900 mb-2'>
                              Your Data is Protected
                            </h4>
                            <p className='text-green-800'>
                              We use industry-standard encryption and security
                              measures to protect your personal information.
                              Payment data is processed securely through trusted
                              third-party providers and never stored on our
                              servers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Your Rights
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        You have the right to access, update, or delete your
                        personal information. You can also opt out of marketing
                        communications at any time.
                      </p>
                      <div className='bg-blue-50 p-4 rounded-lg'>
                        <p className='text-blue-800 text-sm'>
                          <strong>Contact us</strong> at privacy@ourstore.com if
                          you have any questions about your data or wish to
                          exercise your rights.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Terms of Service */}
              <section
                id='terms'
                ref={el => (sectionsRef.current.terms = el as HTMLDivElement)}
                className='p-8 lg:p-12 border-t border-gray-200'
              >
                <div className='flex items-center mb-6'>
                  <FileText className='h-8 w-8 text-purple-600 mr-3' />
                  <h2 className='text-3xl font-bold text-gray-900'>
                    Terms of Service
                  </h2>
                </div>

                <div className='prose prose-lg max-w-none'>
                  <div className='bg-purple-50 border-l-4 border-purple-400 p-4 mb-8'>
                    <p className='text-purple-800 font-medium'>
                      By using our services, you agree to these terms and
                      conditions. Please read them carefully.
                    </p>
                  </div>

                  <div className='space-y-8'>
                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Account & Registration
                      </h3>
                      <div className='space-y-3 text-gray-600'>
                        <p>
                          • You must be at least 18 years old to create an
                          account
                        </p>
                        <p>
                          • You are responsible for maintaining the
                          confidentiality of your account
                        </p>
                        <p>
                          • You must provide accurate and complete information
                        </p>
                        <p>• One person may not maintain multiple accounts</p>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Orders & Payment
                      </h3>
                      <div className='grid md:grid-cols-2 gap-6'>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Order Processing
                          </h4>
                          <ul className='text-gray-600 space-y-1 text-sm'>
                            <li>
                              • Orders are processed within 1-2 business days
                            </li>
                            <li>• We reserve the right to cancel orders</li>
                            <li>• Prices may change without notice</li>
                            <li>• All prices include applicable taxes</li>
                          </ul>
                        </div>
                        <div className='bg-gray-50 p-4 rounded-lg'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Payment Terms
                          </h4>
                          <ul className='text-gray-600 space-y-1 text-sm'>
                            <li>
                              • Payment is required before order processing
                            </li>
                            <li>• We accept major credit cards and PayPal</li>
                            <li>• All transactions are secure and encrypted</li>
                            <li>
                              • Refunds processed within 5-10 business days
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Shipping & Returns
                      </h3>
                      <div className='space-y-4'>
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Shipping Policy
                          </h4>
                          <p className='text-gray-600 text-sm'>
                            We ship to most locations worldwide. Delivery times
                            vary by location. Shipping costs are calculated at
                            checkout. Free shipping available on orders over
                            $50.
                          </p>
                        </div>
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Return Policy
                          </h4>
                          <p className='text-gray-600 text-sm'>
                            Returns accepted within 30 days of delivery. Items
                            must be in original condition. Return shipping costs
                            may apply. Refunds processed after item inspection.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Prohibited Uses
                      </h3>
                      <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                        <p className='text-red-800 text-sm mb-2'>
                          <strong>You may not:</strong>
                        </p>
                        <ul className='text-red-700 space-y-1 text-sm'>
                          <li>• Use our services for any unlawful purpose</li>
                          <li>
                            • Attempt to gain unauthorized access to our systems
                          </li>
                          <li>• Interfere with or disrupt our services</li>
                          <li>• Use automated systems to access our website</li>
                          <li>• Violate any applicable laws or regulations</li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Limitation of Liability
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        Our liability is limited to the maximum extent permitted
                        by law. We are not responsible for indirect, incidental,
                        or consequential damages.
                      </p>
                      <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
                        <p className='text-yellow-800 text-sm'>
                          <strong>Important:</strong> These terms are subject to
                          change. Continued use of our services constitutes
                          acceptance of any modifications.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cookie Policy */}
              <section
                id='cookies'
                ref={el => (sectionsRef.current.cookies = el as HTMLDivElement)}
                className='p-8 lg:p-12 border-t border-gray-200'
              >
                <div className='flex items-center mb-6'>
                  <Cookie className='h-8 w-8 text-green-600 mr-3' />
                  <h2 className='text-3xl font-bold text-gray-900'>
                    Cookie Policy
                  </h2>
                </div>

                <div className='prose prose-lg max-w-none'>
                  <div className='bg-green-50 border-l-4 border-green-400 p-4 mb-8'>
                    <p className='text-green-800 font-medium'>
                      We use cookies and similar technologies to enhance your
                      browsing experience and provide personalized content.
                    </p>
                  </div>

                  <div className='space-y-8'>
                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        What Are Cookies?
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        Cookies are small text files that are stored on your
                        device when you visit our website. They help us remember
                        your preferences and improve your experience.
                      </p>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Types of Cookies We Use
                      </h3>
                      <div className='space-y-4'>
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Essential Cookies
                          </h4>
                          <p className='text-gray-600 text-sm'>
                            Required for basic website functionality, including
                            shopping cart, user authentication, and security
                            features.
                          </p>
                        </div>
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Analytics Cookies
                          </h4>
                          <p className='text-gray-600 text-sm'>
                            Help us understand how visitors interact with our
                            website to improve performance and user experience.
                          </p>
                        </div>
                        <div className='border border-gray-200 rounded-lg p-4'>
                          <h4 className='font-medium text-gray-900 mb-2'>
                            Marketing Cookies
                          </h4>
                          <p className='text-gray-600 text-sm'>
                            Used to deliver relevant advertisements and track
                            campaign effectiveness.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-xl font-semibold text-gray-900 mb-4'>
                        Managing Cookies
                      </h3>
                      <p className='text-gray-600 mb-4'>
                        You can control and delete cookies through your browser
                        settings. However, disabling certain cookies may affect
                        website functionality.
                      </p>
                      <div className='bg-blue-50 p-4 rounded-lg'>
                        <p className='text-blue-800 text-sm'>
                          <strong>Browser Settings:</strong> Most browsers allow
                          you to refuse cookies or delete them. Check your
                          browser's help section for specific instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className='bg-gray-50 px-8 lg:px-12 py-8 border-t border-gray-200'>
                <div className='text-center'>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                    Questions About Our Policies?
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    If you have any questions about our privacy policy, terms of
                    service, or cookie policy, please don't hesitate to contact
                    us.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                    <Link
                      to='/contact'
                      className='inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
                    >
                      <Mail className='h-5 w-5 mr-2' />
                      Contact Support
                    </Link>
                    <Link
                      to='/products'
                      className='inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <ExternalLink className='h-5 w-5 mr-2' />
                      Continue Shopping
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPolicies;
