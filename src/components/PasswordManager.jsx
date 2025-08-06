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

  useEffect(() => {
    const checkUserAuthMethod = async () => {
      if (!user) return;
      
      try {
        // Check if user is from OAuth by looking at app_metadata
        const isOAuth = user.app_metadata?.provider && 
                       (user.app_metadata.provider === 'google' || 
                        user.app_metadata.provider === 'apple');
        
        setIsOAuthUser(isOAuth);
        
        // For OAuth users, we'll show the "Add Password" option
        // For email users, we'll assume they have a password (they can still change it)
        if (isOAuth) {
          setHasPassword(false); // OAuth users need to add a password
        } else {
          setHasPassword(true); // Email users can change their password
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking user auth method:', error);
        setIsOAuthUser(false);
        setHasPassword(true); // Default to showing change password
        setLoading(false);
      }
    };

    checkUserAuthMethod();
  }, [user]);

  // Validate password requirements
  const validatePassword = (password) => {
    const minLength = 8;
    return password.length >= minLength;
  };

  // Check if passwords match
  const validateForm = () => {
    const newErrors = {};
    
    if (hasPassword && !currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters';
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
                       validatePassword(newPassword) &&
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

  // Show for all users - OAuth users can add password, email users can change password
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {hasPassword ? 'Change Password' : 'Add a Password'}
        </CardTitle>
        <CardDescription>
          {hasPassword 
            ? 'Update your password to keep your account secure'
            : 'Set a password so you can log in with email and password'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPassword && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-red-500">{errors.currentPassword}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {hasPassword ? 'New Password' : 'Password'}
          </label>
          <div className="relative">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={hasPassword ? 'Enter new password' : 'Enter your password'}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword}</p>
          )}
          <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirm Password</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You'll receive an email to confirm your password change.
          </AlertDescription>
        </Alert>

        <Button
          onClick={hasPassword ? handleChangePassword : handleSetPassword}
          disabled={!isValid || updating}
          className="w-full bg-forest-green hover:bg-forest-green/90 text-white"
        >
          {updating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {hasPassword ? 'Updating Password...' : 'Setting Password...'}
            </div>
          ) : (
            hasPassword ? 'Update Password' : 'Save Password'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PasswordManager; 