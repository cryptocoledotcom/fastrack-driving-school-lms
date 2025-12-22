import styles from './AboutPage.module.css';

const AboutPage = () => {
  return (
    <div className={styles.aboutPage}>
      <div className={styles.container}>
        <h1 className={styles.title}>About Fastrack Driving School</h1>
        <p className={styles.text}>
          With over 15 years of experience, Fastrack Driving School has been helping students
          become confident, safe drivers. Our expert instructors and modern teaching methods
          ensure you get the best driving education possible.
        </p>
        <p className={styles.text}>
          Since our founding in 2010, we have been a cornerstone of the community of Columbiana county, 
          dedicated to a single, vital mission: shaping safe, confident, and responsible drivers for life. 
          We understand that learning to drive is a serious responsibility, 
          and our entire program is built to provide the highest quality education that goes far beyond just passing the test. 
          We are proud of our history and the thousands of successful drivers who began their journey with us, 
          making our roads safer one student at a time.
        </p>
        <p className={styles.text}>
          The heart of our school is our team of state-certified, professional instructors. We don't just hire experienced drivers; 
          we partner with passionate educators who genuinely love to teach. They are patient, friendly, 
          and specially trained to create a calm and supportive learning environment, which we know is essential for nervous new drivers. 
          Their real-world expertise becomes your advantage, as they provide practical, 
          one-on-one coaching to build your skills and your confidence behind the wheel.
        </p>
        <p className={styles.text}>
          We believe driving is one of life's most important milestones, and we honor that by using modern, engaging teaching techniques. 
          Our curriculum combines essential defensive driving strategies with critical hazard-awareness skills, 
          preparing you for the complex situations you'll face on today's busy roads. We have moved beyond outdated, one-size-fits-all instruction. 
          Instead, we offer a supportive atmosphere where students can ask questions, learn at their own pace, and master the art of safe driving.
        </p>
        <p className={styles.text}>
          From the moment you sign up for our online course and behind-the-wheel lessons to the day you pass your road test, 
          we are here to guide you every step of the way. Fastrack Driving School is your trusted partner. Your safety is our highest priority, 
          and we are committed to helping you become a skilled, responsible member of the driving community.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;