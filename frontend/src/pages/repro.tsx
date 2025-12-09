
import React from 'react';

const Repro = () => {
  const currentStep = 3;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>Case 1</div>
        );

      case 2:
        return (
          <div>
            <div>Case 2</div>
          </div>
        );

        // Comments
        // Comments

      case 3:
        return (
          <div>Case 3</div>
        );

      case 5:
        return (
          <div>Case 5</div>
        );

      default:
        return null;
    }
  };

  return <div>{renderStepContent()}</div>;
};
