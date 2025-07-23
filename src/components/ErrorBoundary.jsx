import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service in production
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-sun-beige flex items-center justify-center p-4">
          <Card className="bg-white/50 border-black/10 shadow-lg rounded-2xl max-w-md mx-auto">
            <CardHeader className="text-center">
              <AlertTriangle className="w-16 h-16 text-warm-orange mx-auto mb-4" />
              <CardTitle className="text-2xl font-bold text-forest-green">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-charcoal-gray/80">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="bg-gradient-to-r from-forest-green to-leaf-green text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 