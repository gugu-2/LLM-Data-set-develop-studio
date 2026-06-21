import React from 'react';
import { Info } from 'lucide-react';

const InfoTooltip = ({ text }) => {
  return (
    <div className="tooltip-container">
      <Info size={14} className="info-icon" />
      <div className="tooltip-bubble">
        {text}
      </div>
    </div>
  );
};

export default InfoTooltip;
