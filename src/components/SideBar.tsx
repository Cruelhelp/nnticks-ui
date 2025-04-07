
import UpdatedSideBar from './UpdatedSideBar';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LineChart } from 'lucide-react';

function App() {
  const navigate = useNavigate();

  return (
    <Router>
      <div className="flex">
        <UpdatedSideBar />
        <div className="p-4 w-full">
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={() => navigate('/charts')}
            >
              <LineChart className="mr-2 h-4 w-4" />
              Charts
            </Button>
          </div>
          <Routes>
            <Route path="/charts" element={<ImprovedCharts />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
