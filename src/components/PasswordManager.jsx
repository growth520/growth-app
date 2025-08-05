import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const PasswordManager = () => {
  console.log('🔍 PasswordManager: Component loaded');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  console.log('🔍 PasswordManager: User object:', user);
  console.log('🔍 PasswordManager: User email:', user?.email);
  console.log('🔍 PasswordManager: User ID:', user?.id);

  useEffect(() => {
    const checkUserAuthMethod = async () => {
      if (!user) return;
      
      try {
        console.log('🔍 PasswordManager: Checking user auth method');
        console.log('🔍 User object:', user);
        console.log('🔍 User app_metadata:', user.app_metadata);
        console.log('🔍 User provider:', user.app_metadata?.provider);
        
        // For now, let's show for all users and detect OAuth based on available fields
        // Check if user is from OAuth by looking at available metadata
        const isOAuth = user.app_metadata?.provider && 
                       (user.app_metadata.provider === 'google' || 
                        user.app_metadata.provider === 'apple');
        
        console.log('🔍 Is OAuth user:', isOAuth);
        
        // If we can't detect OAuth, assume they might want to set a password
        // This will show the component for all users for now
        setIsOAuthUser(true); // Show for all users temporarily
        setHasPassword(false); // Assume they don't have a password initially
        setLoading(false);
      } catch (error) {
        console.error('Error checking user auth method:', error);
        // Show for all users if there's an error
        setIsOAuthUser(true);
        setHasPassword(false);
        setLoading(false);
      }
    };

    checkUserAuthMethod();
  }, [user]);

  // Validate password requirements
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      length: password.length >= minLength,
      uppercase: hasUpperCase,
      lowercase: hasLowerCase,
      number: hasNumbers,
      special: hasSpecialChar
    };
  };

  // Check if passwords match
  const validateForm = () => {
    const newErrors = {};
    
    if (hasPassword && !currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.length) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
    }
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    }
    
    setErrors(newErrors);
    
    // Form is valid if no errors and all required fields are filled
    const isValidForm = Object.keys(newErrors).length === 0 && 
                       newPassword && 
                       confirmPassword && 
                       newPassword === confirmPassword &&
                       (!hasPassword || currentPassword);
    
    setIsValid(isValidForm);
  };

  useEffect(() => {
    validateForm();
  }, [currentPassword, newPassword, confirmPassword, hasPassword]);

  const handleSetPassword = async () => {
    if (!isValid || updating) return;
    
    setUpdating(true);
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true);
      
      toast({
        title: "Password Set Successfully",
        description: "You can now log in with your email and password.",
      });
      
    } catch (error) {
      console.error('Error setting password:', error);
      
      let errorMessage = 'Failed to set password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('password')) {
          errorMessage = 'Password does not meet requirements.';
        } else if (error.message.includes('email')) {
          errorMessage = 'You may need to confirm your email first.';
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!isValid || updating) return;
    
    setUpdating(true);
    
    try {
      // First verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Password Updated Successfully",
        description: "Your password has been changed.",
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Current password is incorrect')) {
          errorMessage = 'Current password is incorrect.';
        } else if (error.message.includes('password')) {
          errorMessage = 'Password does not meet requirements.';
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show for all users for now
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Password Management (Debug Mode)
        </CardTitle>
        <CardDescription>
          Debug: Component is loading. User: {user?.email || 'No user'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-500">
          <p>🔍 Debug Info:</p>
          <p>User ID: {user?.id || 'No ID'}</p>
          <p>User Email: {user?.email || 'No email'}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Is OAuth: {isOAuthUser ? 'Yes' : 'No'}</p>
          <p>Has Password: {hasPassword ? 'Yes' : 'No'}</p>
          <p>Component Loaded: ✅ Yes</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-800">Test Section</p>
          <p className="text-xs text-blue-600">If you can see this, the component is working!</p>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-800">Simple Test</p>
          <p className="text-xs text-green-600">This is a simple test to see if the component renders</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordManager; 