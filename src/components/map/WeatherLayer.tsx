import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets } from 'lucide-react';
import { LatLng } from '@/types/map';

interface WeatherLayerProps {
  center: LatLng;
  isVisible: boolean;
}

interface WeatherData {
  temp: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'windy';
  humidity: number;
  windSpeed: number;
  description: string;
}

export const WeatherLayer: React.FC<WeatherLayerProps> = ({ center, isVisible }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    // Simulate weather data (in production, use a real weather API)
    const conditions: WeatherData['condition'][] = ['sunny', 'cloudy', 'rainy', 'windy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];

    setWeather({
      temp: Math.floor(Math.random() * 15) + 25, // 25-40°C
      condition: randomCondition,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5, // 5-25 km/h
      description: getWeatherDescription(randomCondition),
    });
  }, [isVisible, center]);

  if (!isVisible || !weather) return null;

  const WeatherIcon = getWeatherIcon(weather.condition);

  return (
    <div className="absolute top-24 right-20 glass-panel rounded-xl p-4 z-10 animate-fade-in min-w-[160px]">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <WeatherIcon className="w-6 h-6 text-primary" />
        </div>
        <div>
          <div className="text-2xl font-bold">{weather.temp}°C</div>
          <div className="text-xs text-muted-foreground capitalize">{weather.description}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Droplets className="w-3 h-3" />
          <span>{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Wind className="w-3 h-3" />
          <span>{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
};

function getWeatherIcon(condition: WeatherData['condition']) {
  switch (condition) {
    case 'sunny':
      return Sun;
    case 'cloudy':
      return Cloud;
    case 'rainy':
      return CloudRain;
    case 'windy':
      return Wind;
    default:
      return Sun;
  }
}

function getWeatherDescription(condition: WeatherData['condition']): string {
  switch (condition) {
    case 'sunny':
      return 'Clear sky';
    case 'cloudy':
      return 'Partly cloudy';
    case 'rainy':
      return 'Light rain';
    case 'windy':
      return 'Windy';
    default:
      return 'Clear';
  }
}
