import React, { useState, useEffect } from 'react';
import { useLoading } from '../contexts/LoadingContext';

// Example component showing how to use the global loading context
const ExampleLoadingUsage = () => {
  const { showLoading, hideLoading } = useLoading();

  const handleLongOperation = async () => {
    showLoading('Processing your request...');
    
    // Simulate a long operation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    hideLoading();
  };

  return (
    <div>
      <button onClick={handleLongOperation}>
        Start Long Operation
      </button>
    </div>
  );
};

export default ExampleLoadingUsage;