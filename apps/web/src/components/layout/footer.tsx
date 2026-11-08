'use client';

import Link from 'next/link';
import { Box, Container, Typography, Stack, Divider } from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';

export function Footer() {
  return (
    <Box component="footer" sx={{ backgroundColor: '#FFFFFF', borderTop: '1px solid', borderColor: 'divider', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 4, mb: 4 }}>
          <Box>
            <Link href="/" aria-label="TriFusion AI home" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: 'inherit', marginBottom: 8 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #003F5C 0%, #58508D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>
                <LayersIcon sx={{ fontSize: 18 }} />
              </Box>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>TriFusion AI</Typography>
            </Link>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
              AI-powered business workspace for individuals, freelancers, digital agencies, and IT service companies.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 4 }}>
            <Link href="/#features" style={{ textDecoration: 'none' }}><Typography variant="body2" color="text.secondary">Features</Typography></Link>
            <Link href="/#architecture" style={{ textDecoration: 'none' }}><Typography variant="body2" color="text.secondary">Architecture</Typography></Link>
            <Link href="/login" style={{ textDecoration: 'none' }}><Typography variant="body2" color="text.secondary">Sign in</Typography></Link>
            <Link href="/register" style={{ textDecoration: 'none' }}><Typography variant="body2" color="text.secondary">Create account</Typography></Link>
          </Stack>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2 }}>
          <Typography variant="caption" color="text.secondary">© {new Date().getFullYear()} TriFusion AI. All rights reserved.</Typography>
          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ShieldOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption" color="text.secondary">Workspace isolation</Typography></Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><SecurityIcon sx={{ fontSize: 14, color: 'text.secondary' }} /><Typography variant="caption" color="text.secondary">Role-based access</Typography></Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
