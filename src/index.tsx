import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Config } from './Config';
import { PageInfo } from 'src/pages/info/index';
import { PageDebug } from 'src/pages/debug/index';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageInfo />} />
        <Route path="/debug" element={<PageDebug />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
