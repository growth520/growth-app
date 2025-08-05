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
        
        // For OAuth users, we assume they don't have a password initially
        // In a real implementation, you might want to check this differently
        setHasPassword(!isOAuth);
        setLoading(false);
      } catch (error) {
        console.error('Error checking user auth method:', error);
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

  // Only show for OAuth users
  if (!isOAuthUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {hasPassword ? 'Change Password' : 'Add a Password'}
        </CardTitle>
        <CardDescription>
          {hasPassword 
            ? 'Update your password to keep your account secure.'
            : 'Set a password so you can log in with your email and password.'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPassword && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Password</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className={errors.currentPassword ? 'border-red-500' : ''}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
          <label className="text-sm font-medium">New Password</label>
          <div className="relative">
            <Input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter your new password"
              className={errors.newPassword ? 'border-red-500' : ''}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm New Password</label>
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Password requirements */}
        {newPassword && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Password Requirements:</p>
            <div className="space-y-1 text-sm">
              {(() => {
                const validation = validatePassword(newPassword);
                return [
                  { key: 'length', text: 'At least 8 characters', valid: validation.length },
                  { key: 'uppercase', text: 'One uppercase letter', valid: validation.uppercase },
                  { key: 'lowercase', text: 'One lowercase letter', valid: validation.lowercase },
                  { key: 'number', text: 'One number', valid: validation.number },
                  { key: 'special', text: 'One special character', valid: validation.special }
                ].map((req) => (
                  <div key={req.key} className="flex items-center gap-2">
                    {req.valid ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={req.valid ? 'text-green-600' : 'text-gray-500'}>
                      {req.text}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <Button
          onClick={hasPassword ? handleChangePassword : handleSetPassword}
          disabled={!isValid || updating}
          className="w-full"
        >
          {updating ? 'Updating...' : (hasPassword ? 'Update Password' : 'Set Password')}
        </Button>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You'll receive an email to confirm your password change.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PasswordManager; 