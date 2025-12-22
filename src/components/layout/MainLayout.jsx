// MainLayout Component
// Layout wrapper for public pages (Header + Footer)

import Header from './Header/Header';
import Footer from './Footer/Footer';
import styles from './MainLayout.module.css';

const MainLayout = ({ children }) => {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;