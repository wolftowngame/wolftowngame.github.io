import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Config } from './Config';
import { PageInfo } from 'src/pages/info/index';
import { PageDebug } from 'src/pages/debug/index';
import { PageDebugResult } from 'src/pages/debug/result';
import { PageDebugTransfer } from 'src/pages/debug/transfer';
import AnimapPage from 'src/pages/animal/index';
import { Evt0312 } from 'src/pages/address-wolf/index';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PageInfo />} />
        <Route path="/debug" element={<PageDebug />} />
        <Route path="/animal" element={<AnimapPage />} />
        <Route path="/debug-result" element={<PageDebugResult />} />
        <Route path="/evt0312" element={<Evt0312 />} />
        <Route path="/debug-transfer" element={<PageDebugTransfer />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
