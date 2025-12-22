// HomePage Component
// Landing page with hero section and features

import { Link } from 'react-router-dom';

import Button from '../../components/common/Button/Button';
import Card from '../../components/common/Card/Card';
import { PUBLIC_ROUTES } from '../../constants/routes';

import styles from './HomePage.module.css';

const HomePage = () => {
  const features = [
    {
      icon: '🎓',
      title: 'Expert Instructors',
      description: 'Learn from certified driving instructors with years of experience.'
    },
    {
      icon: '📱',
      title: 'Online Learning',
      description: 'Study at your own pace with our comprehensive online courses.'
    },
    {
      icon: '🚗',
      title: 'Practical Training',
      description: 'Get hands-on experience with our practical driving sessions.'
    },
    {
      icon: '📊',
      title: 'Progress Tracking',
      description: 'Monitor your learning progress with detailed analytics.'
    },
    {
      icon: '🎯',
      title: 'High Pass Rate',
      description: '95% of our students pass their driving test on the first try.'
    },
    {
      icon: '⏰',
      title: 'Flexible Schedule',
      description: 'Choose lesson times that fit your busy schedule.'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Students Trained' },
    { value: '95%', label: 'Pass Rate' },
    { value: '50+', label: 'Expert Instructors' },
    { value: '15+', label: 'Years Experience' }
  ];

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <video
          src="/assets/videos/homepage-logo-video.mp4"
          autoPlay
          loop
          muted
          playsInline
          className={styles.heroVideo}
        />
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>
              Learn to Drive with Confidence
            </h1>
            <p className={styles.heroSubtitle}>
              Join thousands of successful students who learned to drive safely with Fastrack Driving School
            </p>
          </div>
          <div className={styles.heroButtons}>
            <Link to={PUBLIC_ROUTES.REGISTER}>
              <Button variant="primary" size="large">
                Get Started
              </Button>
            </Link>
            <Link to={PUBLIC_ROUTES.COURSES}>
              <Button variant="outline" size="large">
                View Courses
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statItem}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Homepage Video Section */}
      <section className={styles.homepageVideoSection}>
        <div className={styles.container}>
          <video
            src="/assets/videos/homepage-video.mp4"
            autoPlay
            loop
            muted
            playsInline
            className={styles.homepageVideo}
          />
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Choose Fastrack?</h2>
          <p className={styles.sectionSubtitle}>
            We provide comprehensive driving education with modern teaching methods
          </p>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Card key={index} hoverable padding="large">
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <h2 className={styles.ctaTitle}>Ready to Start Your Journey?</h2>
          <p className={styles.ctaSubtitle}>
            Join our community of successful drivers today
          </p>
          <Link to={PUBLIC_ROUTES.REGISTER}>
            <Button variant="primary" size="large">
              Sign Up Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;