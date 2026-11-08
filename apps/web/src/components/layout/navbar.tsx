'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import {
  AppBar, Toolbar, Typography, Button, Box, Container, Chip,
  IconButton, Menu, MenuItem,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileAnchor, setMobileAnchor] = useState<null | HTMLElement>(null);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const personalWorkspace = user?.workspaces?.find((w) => w.type === 'PERSONAL') || user?.workspaces?.[0];

  const handleLogout = async () => {
    setLogoutError(null);
    try { await logout(); }
    catch { setLogoutError('Sign out failed. Please try again.'); }
  };

  const closeMenu = () => setMobileAnchor(null);

  return (
    <AppBar position="sticky" elevation={0} sx={{
      backgroundColor: 'rgba(255, 255, 255, 0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary',
      zIndex: (t) => t.zIndex.drawer + 1,
    }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ minHeight: 72, justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 4 }, minWidth: 0 }}>
            <Link href="/" aria-label="TriFusion AI home" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Box sx={{ width: 38, height: 38, flex: '0 0 auto', borderRadius: '10px', background: 'linear-gradient(135deg, #003F5C 0%, #58508D 50%, #BC5090 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <LayersIcon sx={{ fontSize: 22 }} />
              </Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 800, fontSize: { xs: '1.05rem', sm: '1.25rem' }, letterSpacing: '-0.02em', whiteSpace: 'nowrap', background: 'linear-gradient(90deg, #003F5C, #58508D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                TriFusion<span style={{ color: '#BC5090', WebkitTextFillColor: '#BC5090' }}>AI</span>
              </Typography>
            </Link>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Button component={Link} href="/#features" sx={{ color: 'text.secondary', fontWeight: 500 }}>Features</Button>
              <Button component={Link} href="/#architecture" sx={{ color: 'text.secondary', fontWeight: 500 }}>Architecture</Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 }, minWidth: 0 }}>
            {isAuthenticated && user ? (
              <>
                {personalWorkspace && <Chip label={personalWorkspace.name} size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' }, maxWidth: 150, backgroundColor: 'rgba(0,63,92,.08)', color: 'primary.main' }} />}
                <Button component={Link} href="/dashboard" variant="outlined" size="small" startIcon={<PersonOutlineIcon />} sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 } }}>
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>{user.firstName || 'Dashboard'}</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Workspace</Box>
                </Button>
                <IconButton onClick={() => void handleLogout()} aria-label="Sign out" size="small"><LogoutIcon fontSize="small" /></IconButton>
              </>
            ) : (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
                <Button component={Link} href="/login" sx={{ color: 'text.primary', fontWeight: 600 }}>Sign In</Button>
                <Button component={Link} href="/register" variant="contained" endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />} sx={{ backgroundColor: '#003F5C', color: '#FFFFFF', fontWeight: 600, px: 2.5, borderRadius: 2, '&:hover': { backgroundColor: '#002B40' } }}>Get Started</Button>
              </Box>
            )}
            <IconButton aria-label={mobileAnchor ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={Boolean(mobileAnchor)} onClick={(e) => setMobileAnchor(e.currentTarget)} sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
              {mobileAnchor ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Menu anchorEl={mobileAnchor} open={Boolean(mobileAnchor)} onClose={closeMenu} PaperProps={{ sx: { width: 240, mt: 1, borderRadius: 2 } }}>
              <MenuItem component={Link} href="/#features" onClick={closeMenu}>Features</MenuItem>
              <MenuItem component={Link} href="/#architecture" onClick={closeMenu}>Architecture</MenuItem>
              {isAuthenticated ? (
                <>
                  <MenuItem component={Link} href="/dashboard" onClick={closeMenu}>Workspace</MenuItem>
                  <MenuItem onClick={() => { closeMenu(); void handleLogout(); }}>Sign out</MenuItem>
                </>
              ) : (
                <>
                  <MenuItem component={Link} href="/login" onClick={closeMenu}>Sign In</MenuItem>
                  <MenuItem component={Link} href="/register" onClick={closeMenu}>Get Started</MenuItem>
                </>
              )}
            </Menu>
          </Box>
        </Toolbar>
        {logoutError && <Typography role="alert" variant="caption" color="error" sx={{ display: 'block', pb: 1 }}>{logoutError}</Typography>}
      </Container>
    </AppBar>
  );
}
