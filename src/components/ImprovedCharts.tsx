import React from 'react';
import { Card } from '@/components/ui/card';
import DynamicPriceChart from './DynamicPriceChart';

const ImprovedCharts = () => {
  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h2 className="text-2xl font-bold mb-4">Market Analysis</h2>
        <DynamicPriceChart />
      </Card>
    </div>
  );
};

export default ImprovedCharts;