import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="card-icon">{icon}</div>
    <h3 className="card-title">{title}</h3>
    <p className="card-description">{description}</p>
  </div>
);

const InfoSection = ({ title, children }) => (
  <section className="info-section">
    <h2 className="section-title">{title}</h2>
    <div className="section-content">
      {children}
    </div>
  </section>
);

function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <h1 className="main-title">AI-Powered Timetable Scheduler</h1>
        <p className="subtitle">Intelligent Timetabling for Higher Education Institutions in Jharkhand</p>
        <button onClick={handleGetStarted} className="get-started-btn">Get Started</button>
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
            description="Proudly developed for the Smart India Hackathon (Problem: SIH 25028), addressing real-world educational challenges with innovative technology."
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

        <InfoSection title="The Challenge of Manual Scheduling">
          <p>
            Higher Education institutions often face immense challenges in class scheduling due to limited infrastructure, faculty constraints, diverse elective courses, and overlapping departmental requirements. Manual timetable preparation frequently leads to clashes, underutilized classrooms, uneven workload distribution, and widespread dissatisfaction among both students and faculty.
          </p>
        </InfoSection>

        <InfoSection title="Why AI is Essential (NEP 2020 Context)">
          <p>
            With the introduction of the National Education Policy (NEP) 2020, the complexity of scheduling has grown exponentially, emphasizing flexible, multi-disciplinary learning. An AI-based system is no longer a luxury but a necessity to handle these dynamic requirements, ensuring educational goals are met efficiently and effectively.
          </p>
        </InfoSection>

        <InfoSection title="Expected Outcomes">
          <ul>
            <li>Maximized utilization of classrooms, labs, and other resources.</li>
            <li>Fair and balanced workload distribution for faculty.</li>
            <li>Conflict-free schedules for students, accommodating electives.</li>
            <li>Significant reduction in administrative effort and time.</li>
            <li>Improved overall satisfaction for both students and faculty.</li>
          </ul>
        </InfoSection>

      </main>
    </div>
  );
}

export default HomePage;
