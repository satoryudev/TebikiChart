'use client';

interface Step {
  label: string;
  completed: boolean;
}

interface Props {
  steps: Step[];
}

function StepDot({ index, label, status }: { index: number; label: string; status: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors duration-500 ${
        status === 'done'
          ? 'bg-blue-600 text-white'
          : status === 'active'
          ? 'bg-blue-100 border-2 border-blue-500 text-blue-600 animate-pulse'
          : 'bg-gray-100 border border-gray-300 text-gray-400'
      }`}>
        {status === 'done' ? '✓' : index + 1}
      </div>
      <span className={`text-xs hidden sm:block transition-colors duration-500 ${
        status === 'done' ? 'text-blue-600' : status === 'active' ? 'text-blue-500 font-medium' : 'text-gray-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

export default function EditorStepper({ steps }: Props) {
  const activeIndex = steps.findIndex((s) => !s.completed);
  const currentStep = activeIndex === -1 ? steps.length - 1 : activeIndex;

  return (
    <div className="flex items-start gap-0 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center flex-1">
          <StepDot
            index={i}
            label={step.label}
            status={step.completed ? 'done' : i === currentStep ? 'active' : 'pending'}
          />
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-1 mt-[-10px] transition-colors duration-500 ${
              step.completed ? 'bg-blue-400' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
