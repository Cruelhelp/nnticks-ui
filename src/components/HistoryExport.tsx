import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';
import Logo from '@/components/Logo';

interface TradeHistoryItem {
  id: number;
  timestamp: string;
  market: string;
  prediction: string;
  confidence: number;
  outcome: string;
}

interface TrainingHistoryItem {
  id: number;
  date: string;
  mission: string;
  points: number;
  accuracy: number;
}

interface HistoryExportProps {
  tradeHistory: TradeHistoryItem[];
  trainingHistory: TrainingHistoryItem[];
}

const HistoryExport: React.FC<HistoryExportProps> = ({ tradeHistory, trainingHistory }) => {
  const { userDetails } = useAuth();
  const isPro = userDetails?.proStatus || false;
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const calculateStats = () => {
    if (tradeHistory.length === 0) {
      return { winRate: 0, totalTrades: 0, wins: 0, losses: 0 };
    }
    
    const wins = tradeHistory.filter(trade => trade.outcome === 'win').length;
    const totalTrades = tradeHistory.length;
    const winRate = (wins / totalTrades) * 100;
    
    return {
      winRate: Math.round(winRate * 100) / 100,
      totalTrades,
      wins,
      losses: totalTrades - wins
    };
  };
  
  const stats = calculateStats();
  
  const generatePDF = async () => {
    if (!isPro) {
      toast.error('Export to PDF is a Pro feature');
      return;
    }
    
    try {
      // Simulate PDF generation with loading state
      toast.loading('Generating PDF report...');
      
      setTimeout(() => {
        const styles = `
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1, h2 { color: #333; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; }
          .date { color: #666; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background-color: #f2f2f2; text-align: left; padding: 10px; }
          td { border-bottom: 1px solid #ddd; padding: 10px; }
          .stats { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .stat-box { background-color: #f9f9f9; padding: 20px; border-radius: 5px; width: 22%; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .stat-label { color: #666; }
          .win { color: green; }
          .loss { color: red; }
          .footer { margin-top: 50px; text-align: center; color: #666; font-size: 12px; }
          .visualizations { margin: 20px 0; }
          .chart-container { margin-bottom: 30px; }
        `;
        
        // Create HTML content for the PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Trading History Report</title>
            <style>${styles}</style>
          </head>
          <body>
            <div class="header">
              <div class="logo">NNticks</div>
              <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
            </div>
            
            <h1>Trading Performance Report</h1>
            <p>User: ${userDetails?.username || 'Guest'}</p>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-value">${stats.totalTrades}</div>
                <div class="stat-label">Total Trades</div>
              </div>
              <div class="stat-box">
                <div class="stat-value win">${stats.wins}</div>
                <div class="stat-label">Wins</div>
              </div>
              <div class="stat-box">
                <div class="stat-value loss">${stats.losses}</div>
                <div class="stat-label">Losses</div>
              </div>
              <div class="stat-box">
                <div class="stat-value ${stats.winRate >= 50 ? 'win' : 'loss'}">${stats.winRate}%</div>
                <div class="stat-label">Win Rate</div>
              </div>
            </div>
            
            <div class="visualizations">
              <div class="chart-container">
                <h3>Win/Loss Distribution</h3>
                <!-- Chart would be rendered here in a real implementation -->
                <div style="height: 200px; background-color: #f5f5f5; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
                  [Visualization Chart Rendered Here]
                </div>
              </div>
            </div>
            
            <h2>Trade History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Market</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                ${tradeHistory.map(trade => `
                  <tr>
                    <td>${formatDate(trade.timestamp)}</td>
                    <td>${trade.market}</td>
                    <td>${trade.prediction}</td>
                    <td>${(trade.confidence * 100).toFixed(0)}%</td>
                    <td class="${trade.outcome === 'win' ? 'win' : 'loss'}">${trade.outcome.toUpperCase()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h2>Training History</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Mission</th>
                  <th>Points</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                ${trainingHistory.map(training => `
                  <tr>
                    <td>${formatDate(training.date)}</td>
                    <td>${training.mission}</td>
                    <td>${training.points}</td>
                    <td>${(training.accuracy * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              <p>Copyright 2025 Ruel McNeil | NNticks Trading Performance Report</p>
              <p>This report contains confidential information. Do not distribute without permission.</p>
            </div>
          </body>
          </html>
        `;
        
        // In a real implementation, we'd use a PDF library to convert this HTML to PDF
        // For this demo, we'll just simulate a download
        toast.dismiss();
        toast.success('PDF report generated successfully');
        
        // Simulate download by opening a new window with the report
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          newWindow.print();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.dismiss();
      toast.error('Failed to generate PDF');
    }
  };
  
  const exportCsv = () => {
    try {
      // Create CSV content for trade history
      let csvContent = "data:text/csv;charset=utf-8,";
      
      // Headers
      csvContent += "Date,Market,Prediction,Confidence,Outcome\n";
      
      // Data rows
      tradeHistory.forEach(trade => {
        const row = [
          formatDate(trade.timestamp),
          trade.market,
          trade.prediction,
          (trade.confidence * 100).toFixed(0) + "%",
          trade.outcome.toUpperCase()
        ];
        csvContent += row.join(",") + "\n";
      });
      
      // Create a download link and trigger it
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `trade_history_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV file downloaded');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex gap-2 items-center" 
        onClick={generatePDF}
        disabled={!isPro}
      >
        <Download size={16} />
        Export PDF {!isPro && "(Pro)"}
      </Button>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex gap-2 items-center" 
        onClick={exportCsv}
      >
        <Download size={16} />
        Export CSV
      </Button>
    </div>
  );
};

export default HistoryExport;
