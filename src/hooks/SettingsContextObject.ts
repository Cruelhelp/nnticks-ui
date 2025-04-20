import { createContext } from 'react';
import { SettingsContextType } from './settingsTypes';

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
