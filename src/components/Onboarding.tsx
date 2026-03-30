'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingProps {
  onComplete: () => void;
  userName?: string;
}

const steps = [
  {
    title: 'Welcome to AIReady!',
    description:
      "Let's make your codebase AI-ready. I'll guide you through the basics.",
    icon: '🚀',
  },
  {
    title: 'Add a Repository',
    description:
      'Click "Add Repository" to connect your first project. You can add up to 3 repos on the Free plan.',
    icon: '📁',
  },
  {
    title: 'Run the CLI',
    description:
      'Install and run our CLI to analyze your codebase. It works locally and keeps your code private.',
    icon: '💻',
    code: 'npx @aiready/cli scan . --output json > report.json',
  },
  {
    title: 'Upload & Learn',
    description:
      "Upload the report.json file to see your AI Readiness Score. We'll show you what to fix.",
    icon: '📊',
  },
];

export default function Onboarding({ onComplete, userName }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600"
            />
          </div>

          {/* Content */}
          <div className="p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="text-6xl mb-6"
                >
                  {step.icon}
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  {currentStep === 0 && userName ? `Hi ${userName}! ` : ''}
                  {step.title}
                </h2>
                <p className="text-slate-400 mb-6">{step.description}</p>

                {step.code && (
                  <div className="bg-slate-800/50 rounded-lg p-4 font-mono text-sm text-cyan-400 mb-6 border border-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">$</span>
                      <span>{step.code}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Step indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'bg-cyan-500 w-4'
                      : index < currentStep
                        ? 'bg-cyan-500/50'
                        : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-2.5 border border-slate-600 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
              >
                Skip tour
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNext}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
