
import Card from '../../components/common/Card/Card';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';

import styles from './ProgressPage.module.css';

const ProgressPage = () => {
  return (
    <div className={styles.progressPage}>
      <h1 className={styles.title}>My Progress</h1>
      <Card padding="large">
        <h3>Overall Progress</h3>
        <ProgressBar progress={65} />
      </Card>
    </div>
  );
};

export default ProgressPage;