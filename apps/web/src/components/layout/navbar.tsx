'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Chip,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const personalWorkspace = user?.workspaces?.find((w) => w.type === 'PERSONAL') || user?.workspaces?.[0];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      setLogoutError('Sign out failed. Please try again.');
    }
  };


  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary',
        zIndex: (t) => t.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 72, justifyContent: 'space-between' }}>
          {/* Logo & Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #003F5C 0%, #58508D 50%, #BC5090 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 63, 92, 0.25)',
                  color: '#FFFFFF',
                }}
              >
                <LayersIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(90deg, #003F5C, #58508D)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                TriFusion<span style={{ color: '#BC5090', WebkitTextFillColor: '#BC5090' }}>AI</span>
              </Typography>
            </Link>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Button
                component={Link}
                href="/#features"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 1.5,
                  '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
                }}
              >
                Features
              </Button>
              <Button
                component={Link}
                href="/#architecture"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 1.5,
                  '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
                }}
              >
                Architecture
              </Button>
              <Button
                href="http://localhost:3001/api/docs"
                target="_blank"
                rel="noreferrer"
                startIcon={<DescriptionOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  px: 1.5,
                  '&:hover': { color: 'primary.main', backgroundColor: 'transparent' },
                }}
              >
                API Docs
              </Button>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isAuthenticated && user ? (
              <>
                {personalWorkspace && (
                  <Chip
                    label={`${personalWorkspace.name} (${personalWorkspace.role})`}
                    size="small"
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      backgroundColor: 'rgba(0, 63, 92, 0.08)',
                      color: 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      borderRadius: 1,
                    }}
                  />
                )}
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="outlined"
                  size="small"
                  startIcon={<PersonOutlineIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    {user.firstName || 'Dashboard'}
                  </Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                    Workspace
                  </Box>
                </Button>
                <IconButton
                  onClick={() => void handleLogout()}
                  title="Sign out"
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'error.main', backgroundColor: 'rgba(255, 99, 97, 0.1)' },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
                {logoutError && (
                  <Typography variant="caption" color="error" sx={{ position: 'absolute', top: 72, right: 16 }}>
                    {logoutError}
                  </Typography>
                )}
              </>
            ) : (
              <>
                <Button
                  component={Link}
                  href="/login"
                  variant="text"
                  sx={{
                    color: 'text.primary',
                    fontWeight: 600,
                    px: 2,
                    fontSize: '0.9rem',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  href="/register"
                  variant="contained"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: '#003F5C',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    boxShadow: '0 4px 14px rgba(0, 63, 92, 0.25)',
                    '&:hover': {
                      backgroundColor: '#002B40',
                      boxShadow: '0 6px 20px rgba(0, 63, 92, 0.35)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <IconButton
              sx={{ display: { xs: 'flex', md: 'none' }, ml: 0.5 }}
              onClick={(e) => setMobileAnchor(e.currentTarget)}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileAnchor}
              open={Boolean(mobileAnchor)}
              onClose={() => setMobileAnchor(null)}
              PaperProps={{
                sx: { width: 220, mt: 1, borderRadius: 2, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
              }}
            >
              <MenuItem component={Link} href="/#features" onClick={() => setMobileAnchor(null)}>
                Features
              </MenuItem>
              <MenuItem component={Link} href="/#architecture" onClick={() => setMobileAnchor(null)}>
                Architecture
              </MenuItem>
              <MenuItem
                component="a"
                href="http://localhost:3001/api/docs"
                target="_blank"
                onClick={() => setMobileAnchor(null)}
              >
                API Docs
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

