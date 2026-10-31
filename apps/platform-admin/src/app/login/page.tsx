'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Stack,
  Divider,
  Container,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LayersIcon from '@mui/icons-material/Layers';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Submit to real backend auth login
      const response = await fetch('/api/backend/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
            ? result.message
            : 'Authentication failed. Please check your credentials.';
        throw new Error(message);
      }

      // Step 2: Verify active platform staff role with the backend
      const staffResponse = await fetch('/api/backend/platform/staff/me', {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { accept: 'application/json' },
      });

      if (!staffResponse.ok) {
        // Log out / clear cookie because user has no platform staff privileges
        await fetch('/api/backend/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
        throw new Error(
          'Access Denied: Your account does not hold an active Platform Staff role (SUPERADMIN, PLATFORM_ADMIN, ANALYST, or SUPPORT_AGENT). Customer workspace credentials cannot access Platform Administration.',
        );
      }

      const staffData: unknown = await staffResponse.json();
      if (
        !staffData ||
        typeof staffData !== 'object' ||
        !('role' in staffData) ||
        !['SUPERADMIN', 'PLATFORM_ADMIN', 'ANALYST', 'SUPPORT_AGENT'].includes(String(staffData.role))
      ) {
        await fetch('/api/backend/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
        throw new Error('Platform staff role validation failed.');
      }

      // Step 3: Redirect to destination or dashboard
      const nextPath = new URLSearchParams(window.location.search).get('next');
      const protectedPaths = ['/', '/audit', '/analytics', '/users', '/settings', '/health', '/metrics', '/staff', '/workspaces', '/grants', '/flags'];
      const target = nextPath && protectedPaths.includes(nextPath) ? nextPath : '/';

      router.replace(target);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0B0F19 0%, #111827 50%, #003F5C 100%)',
        p: { xs: 2, sm: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background glow effects */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(188, 80, 144, 0.15) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 63, 92, 0.25) 0%, rgba(0,0,0,0) 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          elevation={12}
          sx={{
            borderRadius: 3.5,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Card Top Brand Strip */}
          <Box
            sx={{
              height: 6,
              background: 'linear-gradient(90deg, #003F5C 0%, #58508D 25%, #BC5090 50%, #FF6361 75%, #FFA600 100%)',
            }}
          />

          <CardContent sx={{ p: { xs: 3.5, sm: 5 } }}>
            {/* Header with Logo */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  background: 'linear-gradient(135deg, #003F5C 0%, #58508D 100%)',
                  color: '#FFFFFF',
                  boxShadow: '0 8px 16px rgba(0, 63, 92, 0.25)',
                  mb: 2,
                }}
              >
                <LayersIcon sx={{ fontSize: 30 }} />
              </Box>

              <Typography
                variant="h4"
                component="h1"
                sx={{
                  fontWeight: 800,
                  color: '#003F5C',
                  letterSpacing: '-0.02em',
                  mb: 1,
                  fontSize: { xs: '1.65rem', sm: '1.95rem' },
                }}
              >
                Platform Staff Sign In
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380, mx: 'auto' }}>
                Secure operational gateway for TriFusion AI administrators, systems analysts, and operators.
              </Typography>
            </Box>

            {/* Error Banner */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  '& .MuiAlert-message': { fontSize: '0.875rem' },
                }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <form onSubmit={(e) => void submit(e)} noValidate>
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    component="label"
                    htmlFor="staff-email"
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75, display: 'block' }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    id="staff-email"
                    type="email"
                    fullWidth
                    required
                    autoComplete="email"
                    autoFocus
                    placeholder="staff@trifusion.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    component="label"
                    htmlFor="staff-password"
                    variant="caption"
                    sx={{ fontWeight: 600, color: 'text.primary', mb: 0.75, display: 'block' }}
                  >
                    Password
                  </Typography>
                  <TextField
                    id="staff-password"
                    type={showPassword ? 'text' : 'password'}
                    fullWidth
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{ color: 'primary.main', '&.Mui-checked': { color: 'primary.main' } }}
                      />
                    }
                    label={
                      <Typography variant="body2" color="text.secondary">
                        Remember session
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={submitting}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    borderRadius: 2,
                    backgroundColor: '#003F5C',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 14px rgba(0, 63, 92, 0.3)',
                    '&:hover': {
                      backgroundColor: '#002B40',
                      boxShadow: '0 6px 20px rgba(0, 63, 92, 0.4)',
                    },
                  }}
                >
                  {submitting ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Authenticating Staff Credentials…</span>
                    </Box>
                  ) : (
                    'Sign In to Platform Admin'
                  )}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 4 }} />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.secondary' }}>
              <ShieldOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">
                All platform actions are cryptographically signed and audit-logged.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
