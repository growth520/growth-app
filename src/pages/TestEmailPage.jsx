import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { getAuthCallbackUrl } from '@/lib/config';
import { useToast } from '@/components/ui/use-toast';

const TestEmailPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);

  const testEmailConfirmation = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to test email confirmation",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      console.log('🔍 Testing email confirmation for:', user.email);
      console.log('User provider:', user.app_metadata?.provider);
      console.log('Email confirmed:', user.email_confirmed_at);
      
      // Test 1: Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: getAuthCallbackUrl()
      });

      if (error) {
        console.error('❌ Error sending reset email:', error);
        toast({
          title: "Error",
          description: `Failed to send email: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Password reset email sent successfully');
        toast({
          title: "Email Sent",
          description: "Password reset email sent! Check your inbox and spam folder.",
        });
      }
      
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const checkUserStatus = () => {
    if (!user) {
      return <p>Not logged in</p>;
    }

    return (
      <div className="space-y-2 text-sm">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Provider:</strong> {user.app_metadata?.provider || 'email'}</p>
        <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}</p>
        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleString()}</p>
        <p><strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-sun-beige text-charcoal-gray font-lato p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-forest-green">Email Confirmation Test</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>User Status</CardTitle>
          </CardHeader>
          <CardContent>
            {checkUserStatus()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Email Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              This will send a password reset email to test if email confirmation is working.
            </p>
            
            <Button 
              onClick={testEmailConfirmation}
              disabled={testing || !user}
              className="bg-forest-green hover:bg-forest-green/90 text-white"
            >
              {testing ? 'Sending Email...' : 'Send Test Email'}
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p><strong>Troubleshooting Steps:</strong></p>
              <p>1. Check your email inbox and spam folder</p>
              <p>2. Verify Supabase email settings in dashboard</p>
              <p>3. Check if email provider is configured</p>
              <p>4. Look at browser console for detailed logs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supabase Configuration Check</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Site URL:</strong> {getAuthCallbackUrl()}</p>
            <p><strong>Environment:</strong> {import.meta.env.MODE}</p>
            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL}</p>
            <p><strong>Has Anon Key:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email Configuration Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
              <p><strong>If you're getting "Error sending recovery email":</strong></p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Go to your Supabase Dashboard</li>
                <li>Navigate to Authentication → Email Templates</li>
                <li>Make sure email provider is configured (SendGrid, etc.)</li>
                <li>Check if Site URL is set correctly</li>
                <li>Verify email templates are not empty</li>
              </ul>
            </div>
            
            <div className="text-sm text-blue-600 bg-blue-50 p-4 rounded-lg">
              <p><strong>Quick Fix Steps:</strong></p>
              <ol className="list-decimal pl-4 mt-2 space-y-1">
                <li>Go to Supabase Dashboard → Authentication → Settings</li>
                <li>Set Site URL to: <code>{getAuthCallbackUrl()}</code></li>
                <li>Go to Email Templates and verify they're configured</li>
                <li>Check if you have an email provider set up</li>
                <li>Test the email functionality in Supabase dashboard</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestEmailPage; 