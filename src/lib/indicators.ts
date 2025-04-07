
export class Indicators {
  static calculateRSI(values: number[], period: number = 14): number {
    if (values.length < period) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < period; i++) {
      const difference = values[i] - values[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static calculateMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1];
    const slice = values.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
  }

  static calculateBollingerBands(values: number[], period: number = 20): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const ma = this.calculateMA(values, period);
    const slice = values.slice(-period);
    const std = Math.sqrt(
      slice.reduce((sum, val) => sum + Math.pow(val - ma, 2), 0) / period
    );
    
    return {
      upper: ma + std * 2,
      middle: ma,
      lower: ma - std * 2
    };
  }
}
