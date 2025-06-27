import React from 'react';
import { createRoot } from 'react-dom/client';
import GameHub from './GameHub';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<GameHub />);
