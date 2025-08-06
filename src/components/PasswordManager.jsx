import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Mail, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getAuthCallbackUrl } from '@/lib/config';

const PasswordManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOAuthUser, setIsOAuthUser] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [showDirectPassword, setShowDirectPassword] = useState(false);
  
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
        
        // Check if user has a password by trying to get user info
        // We'll assume OAuth users don't have passwords initially
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
    
    if (hasPassword && !currentPassword && !showDirectPassword) {
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
                       (!hasPassword || currentPassword || showDirectPassword);
    
    setIsValid(isValidForm);
  };

  useEffect(() => {
    validateForm();
  }, [currentPassword, newPassword, confirmPassword, hasPassword, showDirectPassword]);

  const handleSetPassword = async () => {
    if (!isValid || updating) return;
    
    setUpdating(true);
    
    try {
      // For OAuth users, we'll use resetPasswordForEmail to set a password
      // This is the recommended approach for OAuth users adding a password
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: getAuthCallbackUrl()
      });

      if (error) {
        // If email service is not configured, show fallback option
        if (error.message.includes('recovery email') || error.message.includes('Error sending recovery email')) {
          setEmailError(true);
          setUpdating(false);
          return;
        }
        throw error;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true);
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email to complete setting your password.",
      });
      
    } catch (error) {
      console.error('Error setting password:', error);
      
      let errorMessage = 'Failed to set password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('recovery email')) {
          errorMessage = 'Email service is not configured. Please contact support.';
        } else if (error.message.includes('password')) {
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

  const handleDirectPasswordSet = async () => {
    if (!isValid || updating) return;
    
    setUpdating(true);
    
    try {
      // Try to update user password directly (this might work for some cases)
      const { error } = await supabase.auth.updateUser({
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
      setEmailError(false);
      setShowDirectPassword(false);
      
      toast({
        title: "Password Set Successfully",
        description: "Your password has been set. You can now log in with email and password.",
      });
      
    } catch (error) {
      console.error('Error setting password directly:', error);
      
      toast({
        title: "Error",
        description: "Failed to set password. Please try the email method or contact support.",
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
      // For password changes, use resetPasswordForEmail to ensure email confirmation
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: getAuthCallbackUrl()
      });

      if (error) {
        // If email service is not configured, show fallback option
        if (error.message.includes('recovery email') || error.message.includes('Error sending recovery email')) {
          setEmailError(true);
          setUpdating(false);
          return;
        }
        throw error;
      }

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email to complete changing your password.",
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('recovery email')) {
          errorMessage = 'Email service is not configured. Please contact support.';
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
        {emailError && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Email service is not configured. You can try setting a password directly, or contact support to configure email notifications.
            </AlertDescription>
          </Alert>
        )}

        {hasPassword && !showDirectPassword && (
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

        {!emailError && (
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              You'll receive an email to confirm your password change. Please check your inbox and spam folder.
            </AlertDescription>
          </Alert>
        )}

        {emailError ? (
          <div className="space-y-3">
            <Button
              onClick={handleDirectPasswordSet}
              disabled={!isValid || updating}
              className="w-full bg-forest-green hover:bg-forest-green/90 text-white"
            >
              {updating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Setting Password...
                </div>
              ) : (
                'Set Password Directly'
              )}
            </Button>
            <Button
              onClick={() => {
                setEmailError(false);
                setShowDirectPassword(false);
              }}
              variant="outline"
              className="w-full"
            >
              Try Email Method Again
            </Button>
          </div>
        ) : (
          <Button
            onClick={hasPassword ? handleChangePassword : handleSetPassword}
            disabled={!isValid || updating}
            className="w-full bg-forest-green hover:bg-forest-green/90 text-white"
          >
            {updating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {hasPassword ? 'Sending Reset Email...' : 'Sending Reset Email...'}
              </div>
            ) : (
              hasPassword ? 'Send Password Reset Email' : 'Send Password Reset Email'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordManager; 