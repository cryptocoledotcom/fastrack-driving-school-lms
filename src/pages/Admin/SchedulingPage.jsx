import SchedulingManagement from '../../components/admin/SchedulingManagement';
import Card from '../../components/common/Card/Card';

const SchedulingPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Lesson Scheduling</h1>
      <Card padding="large">
        <SchedulingManagement />
      </Card>
    </div>
  );
};

export default SchedulingPage;
