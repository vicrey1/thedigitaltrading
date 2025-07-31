
import React, { useState, useEffect } from 'react';
import GoldenCursorGlow from '../components/GoldenCursorGlow.js';
import Header from '../landingpage/components/Header.js';
import Sidebar from '../landingpage/components/Sidebar.js';
import HeroSection from '../landingpage/components/HeroSection.js';
import Sponsors from '../landingpage/components/Sponsors.js';
import About from '../landingpage/components/About.js';
import Aura from '../landingpage/components/Aura.js';
import AdvancedFeatures from '../landingpage/components/AdvancedFeatures.js';
import Philosophy from '../landingpage/components/Philosophy.js';
import HowItWorks from '../landingpage/components/HowItWorks.js';
import Testimonials from '../landingpage/components/Testimonials.js';
import Faq from '../landingpage/components/Faq.js';
import Footer from '../landingpage/components/Footer.js';

export default function LandingPage() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isSidebarOpen]);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <GoldenCursorGlow />
      <Header onMenuClick={toggleSidebar} />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div id="sidebar-overlay" className={`fixed inset-0 bg-black/50 z-40 ${isSidebarOpen ? '' : 'hidden'}`} onClick={closeSidebar} />
      <main>
        <HeroSection />
        <Sponsors />
        <About />
        <Aura />
        <AdvancedFeatures />
        <Philosophy />
        <HowItWorks />
        <Testimonials />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
