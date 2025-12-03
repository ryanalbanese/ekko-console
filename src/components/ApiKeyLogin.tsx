import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, Eye, EyeOff } from 'lucide-react';
import { AxiosError } from 'axios';
import { setToken, setBootstrapData } from '../utils/auth';
import { getBootstrapData } from '../utils/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';

export function ApiKeyLogin() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    // Remove client-side ekko_ prefix validation (let backend validate)
    const trimmedKey = apiKey.trim();

    setIsSubmitting(true);

    try {
      // Call bootstrap endpoint to validate key and get project config
      // Pass token directly to avoid timing issues with localStorage
      const bootstrap = await getBootstrapData(trimmedKey);

      // Store bootstrap data FIRST to avoid race condition with checkAuth()
      setBootstrapData(bootstrap);

      // Then store token (this triggers token change listeners)
      setToken(trimmedKey);

      // Route to playground
      navigate('/playground');
    } catch (err: unknown) {
      // Clear token on error
      setToken('');
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to validate API key. Please check your key and try again.';
      
      if (err instanceof AxiosError) {
        // Handle 401 Unauthorized with a friendly message
        if (err.response?.status === 401) {
          errorMessage = 'Invalid API key. Please check your key and try again.';
        } else if (err.response?.status) {
          // For other HTTP errors, use a generic message
          errorMessage = 'Failed to validate API key. Please check your key and try again.';
        } else if (err.message) {
          // For network errors, use the error message
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        // For non-Axios errors, use the error message if available
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Bootstrap error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Exact layout from login-02 block */}
      <div className="grid min-h-svh lg:grid-cols-2">
        {/* Left side - Form */}
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <img
                  src="/logo-dark.svg"
                  alt="EKko logo"
                  className="size-4"
                />
              </div>
              EKko
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  <div className="flex flex-col items-center gap-1 text-center">
                    <h1 className="text-2xl font-bold">Partner Demo</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                      Enter your API key below to get started
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-md"
                    >
                      {error}
                    </div>
                  )}

                  <Field>
                    <FieldLabel htmlFor="apiKey">API Key</FieldLabel>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        name="apiKey"
                        type={showKey ? 'text' : 'password'}
                        required
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter your Ekko API key"
                        className="pr-10"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                        disabled={isSubmitting}
                      >
                        {showKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Validating...' : 'Continue'}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </div>
          </div>
        </div>

        {/* Right side - Cover image (muted background) */}
        <div className="bg-muted relative hidden lg:block">
          <img
            src="/auth-bg.jpg"
            alt="EKko"
            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
          />
        </div>
      </div>
    </>
  );
}
