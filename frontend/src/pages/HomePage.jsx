import React from 'react';
import './HomePage.css'; // Import the new styles

// You can use any icon library or SVGs. These are just placeholder emojis.
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="card-icon">{icon}</div>
    <h3 className="card-title">{title}</h3>
    <p className="card-description">{description}</p>
  </div>
);

function HomePage() {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="main-title">EduScheduler</h1>
        <p className="subtitle">Intelligent Timetabling for a Smarter Jharkhand</p>
      </header>

      <main>
        <div className="features-grid">
          <FeatureCard
            icon="🧠"
            title="AI-Powered Scheduling"
            description="Leveraging advanced algorithms to automatically generate optimized, conflict-free timetables, saving hundreds of administrative hours."
          />
          <FeatureCard
            icon="🏆"
            title="SIH 2023 Hackathon Project"
            description="Proudly developed as a solution for the Smart India Hackathon, addressing real-world educational challenges with innovative technology."
          />
          <FeatureCard
            icon="🇮🇳"
            title="Solving for Jharkhand Govt."
            description="A dedicated solution to tackle complex scheduling problems faced by educational institutions under the Government of Jharkhand."
          />
          <FeatureCard
            icon="⚡️"
            title="Dynamic & Smart Timetables"
            description="Create, manage, and distribute timetables that adapt to changing needs, resource availability, and faculty preferences effortlessly."
          />
        </div>
      </main>
    </div>
  );
}

export default HomePage;