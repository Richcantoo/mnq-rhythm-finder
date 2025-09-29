import { useState } from 'react';
import { Upload, Brain, Database, Target, HelpCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EnhancedProgressNavProps {
  currentStep: 'upload' | 'analyze' | 'gallery' | 'predict';
  uploadedCount: number;
  analyzedCount: number;
  onStepChange: (step: 'upload' | 'analyze' | 'gallery' | 'predict') => void;
}

const steps = [
  {
    id: 'upload' as const,
    label: 'Upload',
    icon: Upload,
    description: 'Upload MNQ chart screenshots for analysis',
    helpText: 'Start by uploading one or more 5-minute MNQ chart screenshots. The AI works best with clear, high-resolution charts showing price action, volume, and timeframes.'
  },
  {
    id: 'analyze' as const,
    label: 'Analyze',
    icon: Brain,
    description: 'AI analyzes patterns and key levels',
    helpText: 'Our AI examines each chart for patterns like breakouts, reversals, support/resistance levels, and correlates them with session times and market conditions.'
  },
  {
    id: 'gallery' as const,
    label: 'Gallery',
    icon: Database,
    description: 'Browse and filter analyzed patterns',
    helpText: 'View all analyzed patterns in an organized gallery. Filter by pattern type, confidence score, session time, or date range to find specific insights.'
  },
  {
    id: 'predict' as const,
    label: 'Predict',
    icon: Target,
    description: 'Get AI predictions for new charts',
    helpText: 'Upload a current MNQ chart to get AI-powered predictions based on similar historical patterns from your analyzed database.'
  }
];

export function EnhancedProgressNav({ currentStep, uploadedCount, analyzedCount, onStepChange }: EnhancedProgressNavProps) {
  const [showHelp, setShowHelp] = useState<string | null>(null);

  const getStepStatus = (stepId: string) => {
    switch (stepId) {
      case 'upload':
        return uploadedCount > 0 ? 'completed' : currentStep === 'upload' ? 'current' : 'pending';
      case 'analyze':
        return analyzedCount > 0 ? 'completed' : currentStep === 'analyze' ? 'current' : uploadedCount > 0 ? 'available' : 'pending';
      case 'gallery':
        return currentStep === 'gallery' ? 'current' : analyzedCount > 0 ? 'available' : 'pending';
      case 'predict':
        return currentStep === 'predict' ? 'current' : analyzedCount > 0 ? 'available' : 'pending';
      default:
        return 'pending';
    }
  };

  const canNavigateToStep = (stepId: string) => {
    const status = getStepStatus(stepId);
    return status === 'completed' || status === 'available' || status === 'current';
  };

  const handleStepClick = (stepId: 'upload' | 'analyze' | 'gallery' | 'predict') => {
    if (canNavigateToStep(stepId)) {
      onStepChange(stepId);
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full max-w-4xl mx-auto">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center">
          <div className="flex items-center gap-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id);
              const canNavigate = canNavigateToStep(step.id);
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-300",
                            "hover:scale-105 focus-visible:scale-105",
                            status === 'current' && "bg-primary/20 text-primary shadow-glow border border-primary/30",
                            status === 'completed' && "bg-bullish/20 text-bullish hover:bg-bullish/30",
                            status === 'available' && "bg-muted/20 text-foreground hover:bg-muted/30",
                            status === 'pending' && "bg-muted/10 text-muted-foreground cursor-not-allowed",
                            canNavigate && "cursor-pointer"
                          )}
                          onClick={() => handleStepClick(step.id)}
                          disabled={!canNavigate}
                        >
                          <div className="relative">
                            <Icon className="w-4 h-4" />
                            {status === 'completed' && (
                              <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-bullish" />
                            )}
                          </div>
                          <span className="text-sm font-medium">{step.label}</span>
                          {step.id === 'upload' && uploadedCount > 0 && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                              {uploadedCount}
                            </span>
                          )}
                          {step.id === 'analyze' && analyzedCount > 0 && (
                            <span className="text-xs bg-bullish/20 text-bullish px-2 py-0.5 rounded-full">
                              {analyzedCount}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium">{step.description}</p>
                          <p className="text-xs text-muted-foreground">{step.helpText}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-6 h-6 p-0 hover:bg-muted/20"
                          onClick={() => setShowHelp(showHelp === step.id ? null : step.id)}
                        >
                          <HelpCircle className="w-3 h-3 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>Click for detailed help</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-8 h-0.5 transition-all duration-500",
                      getStepStatus(steps[index + 1].id) !== 'pending' ? "bg-primary" : "bg-muted/30"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <div className="flex items-center justify-between bg-card/50 rounded-lg p-3 border border-border/30">
            <div className="flex items-center gap-3">
              {steps.map((step) => {
                if (step.id === currentStep) {
                  const Icon = step.icon;
                  const status = getStepStatus(step.id);
                  
                  return (
                    <div key={step.id} className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        status === 'current' && "bg-primary/20 border border-primary/30",
                        status === 'completed' && "bg-bullish/20",
                        status === 'available' && "bg-muted/20"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          status === 'current' && "text-primary",
                          status === 'completed' && "text-bullish",
                          status === 'available' && "text-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{step.label}</p>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
            
            <div className="flex items-center gap-1">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    getStepStatus(step.id) === 'completed' && "bg-bullish",
                    getStepStatus(step.id) === 'current' && "bg-primary w-6",
                    getStepStatus(step.id) === 'available' && "bg-muted",
                    getStepStatus(step.id) === 'pending' && "bg-muted/30"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Help Panel */}
        {showHelp && (
          <div className="mt-4 p-4 bg-card/50 rounded-lg border border-border/30 backdrop-blur-sm">
            {steps.map((step) => {
              if (step.id === showHelp) {
                const Icon = step.icon;
                return (
                  <div key={step.id} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{step.label} Stage</h3>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <div className="pl-14">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {step.helpText}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}