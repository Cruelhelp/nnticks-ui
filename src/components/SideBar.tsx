
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Home, LineChart, Activity } from 'lucide-react';

const SideBar = () => {
  return (
    <div className="h-full flex flex-col gap-2 p-4">
      <NavLink to="/">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Home className="h-4 w-4" /> Home
        </Button>
      </NavLink>
      <NavLink to="/charts">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <LineChart className="h-4 w-4" /> Charts
        </Button>
      </NavLink>
      <NavLink to="/training">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Brain className="h-4 w-4" /> Neural Network
        </Button>
      </NavLink>
      <NavLink to="/predictions">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Activity className="h-4 w-4" /> Predictions
        </Button>
      </NavLink>
    </div>
  );
};

export default SideBar;
