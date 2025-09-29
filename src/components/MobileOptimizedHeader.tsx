import { useState } from 'react';
import { TrendingUp, Database, Brain, Menu, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface MobileOptimizedHeaderProps {
  currentStep: 'upload' | 'analyze' | 'gallery' | 'predict';
  uploadedCount: number;
  analyzedCount: number;
  onReset?: () => void;
}

export function MobileOptimizedHeader({ 
  currentStep, 
  uploadedCount, 
  analyzedCount, 
  onReset 
}: MobileOptimizedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStatusInfo = () => {
    switch (currentStep) {
      case 'upload':
        return { title: 'Upload Charts', description: 'Add MNQ screenshots for analysis' };
      case 'analyze':
        return { title: 'AI Analysis', description: `Analyzing ${uploadedCount} charts...` };
      case 'gallery':
        return { title: 'Pattern Gallery', description: `${analyzedCount} patterns analyzed` };
      case 'predict':
        return { title: 'Predictions', description: 'Get AI-powered insights' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <header className="border-b border-border/20 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 animate-pulse-glow">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MNQ Rhythm Finder</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Chart Pattern Recognition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1 animate-float">
              <Brain className="w-3 h-3" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Database className="w-3 h-3" />
              Lovable Cloud
            </Badge>
            {(uploadedCount > 0 || analyzedCount > 0) && (
              <Button variant="ghost" size="sm" onClick={onReset}>
                <Settings className="w-4 h-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">MNQ Rhythm</h1>
                <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
              </div>
            </div>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    MNQ Rhythm Finder
                  </SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Current Status */}
                  <div className="p-4 bg-card rounded-lg border">
                    <h3 className="font-semibold mb-2">{statusInfo.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{statusInfo.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Charts Uploaded:</span>
                        <Badge variant="outline">{uploadedCount}</Badge>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Patterns Analyzed:</span>
                        <Badge variant="outline">{analyzedCount}</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div className="space-y-3">
                    <h3 className="font-semibold">Features</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-sm">AI Pattern Recognition</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-sm">Smart Database</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-sm">Time Analysis</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="space-y-2">
                    {(uploadedCount > 0 || analyzedCount > 0) && (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => {
                          onReset?.();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Reset Workflow
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}