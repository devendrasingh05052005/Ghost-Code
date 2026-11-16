import React from 'react';
import { Stepper } from './Stepper';

export { Stepper, WORKFLOW_STEPS } from './Stepper';

export const WorkflowStepper: React.FC<{
  currentPage: string;
  onNavigate: (page: string) => void;
  selectedProject?: any;
}> = ({ currentPage, onNavigate }) => {
  return <Stepper current={currentPage} maxReached={currentPage} onGo={onNavigate} />;
};
