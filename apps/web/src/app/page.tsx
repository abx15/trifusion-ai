'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupsIcon from '@mui/icons-material/Groups';
import HubIcon from '@mui/icons-material/Hub';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CodeIcon from '@mui/icons-material/Code';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ShieldIcon from '@mui/icons-material/Shield';

export default function Home() {

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* ===================== HERO SECTION ===================== */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 8, md: 14 },
          pb: { xs: 10, md: 16 },
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        {/* Subtle decorative background glow */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: { xs: 320, md: 800 },
            height: { xs: 200, md: 400 },
            background:
              'radial-gradient(circle, rgba(188, 80, 144, 0.12) 0%, rgba(88, 80, 141, 0.08) 50%, rgba(0, 63, 92, 0) 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', maxWidth: 860, mx: 'auto' }}>
            {/* Announcement Pill */}
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 16, color: '#DE5A79' }} />}
              label="Next-Gen AI Business Workspace • Multi-Tenant Architecture"
              variant="outlined"
              sx={{
                mb: 3,
                py: 2,
                px: 1,
                fontSize: '0.85rem',
                fontWeight: 600,
                borderColor: 'rgba(188, 80, 144, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 2px 8px rgba(188, 80, 144, 0.08)',
              }}
            />

            {/* Main Headline */}
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' },
                fontWeight: 800,
                lineHeight: { xs: 1.15, md: 1.08 },
                letterSpacing: '-0.03em',
                mb: 3,
                color: '#003F5C',
              }}
            >
              Unified Intelligence for Modern{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(135deg, #003F5C 0%, #8A508F 40%, #FF6361 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Workspaces
              </Box>
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1.1rem', md: '1.35rem' },
                color: 'text.secondary',
                fontWeight: 400,
                lineHeight: 1.6,
                mb: 5,
                maxWidth: 720,
                mx: 'auto',
              }}
            >
              TriFusion AI combines multi-tenant company and personal workspaces, intelligent project management, real-time collaboration, and domain-trained AI assistants into one secure platform.
            </Typography>

            {/* CTA Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
              alignItems="center"
              sx={{ mb: 6 }}
            >
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: '#003F5C',
                  color: '#FFFFFF',
                  px: 4,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  boxShadow: '0 8px 24px rgba(0, 63, 92, 0.28)',
                  '&:hover': {
                    backgroundColor: '#002B40',
                    boxShadow: '0 12px 32px rgba(0, 63, 92, 0.38)',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                component={Link}
                href="/login"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  color: '#003F5C',
                  px: 3.5,
                  py: 1.75,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2.5,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  '&:hover': {
                    borderColor: '#003F5C',
                    backgroundColor: 'rgba(0, 63, 92, 0.04)',
                  },
                }}
              >
                Sign In to Workspace
              </Button>
            </Stack>

            {/* Quick Proof Badges */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 4 }}
              justifyContent="center"
              alignItems="center"
              sx={{ color: 'text.secondary', fontSize: '0.875rem' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 18 }} />
                <span>Strict Tenant Boundary Isolation</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 18 }} />
                <span>Role-Based Permissions</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon sx={{ color: '#10B981', fontSize: 18 }} />
                <span>Audit-Ready Logging</span>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* ===================== BENTO GRID FEATURES ===================== */}
      <Box id="features" sx={{ py: { xs: 8, md: 14 }, backgroundColor: '#FAFAFB' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="overline"
              sx={{ color: '#BC5090', fontWeight: 700, letterSpacing: '0.1em' }}
            >
              ENTERPRISE-GRADE CAPABILITIES
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                color: '#003F5C',
                mt: 1,
                mb: 2,
                fontSize: { xs: '2rem', md: '2.5rem' },
              }}
            >
              Engineered for Seamless Execution
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 640, mx: 'auto' }}>
              Everything your team needs to run operations, coordinate projects, and leverage artificial intelligence with confidence.
            </Typography>
          </Box>

          {/* Bento Grid Layout */}
          <Grid container spacing={3}>
            {/* Card 1: Multi-Tenancy (Wide) */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F9F9FC 100%)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0, 63, 92, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0, 63, 92, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#003F5C',
                      mb: 2.5,
                    }}
                  >
                    <BusinessCenterIcon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#003F5C', mb: 1.5 }}>
                    Multi-Tenant Workspaces
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                    Switch effortlessly between individual freelancer workspaces and enterprise organization tenants. Every tenant is strictly partitioned with database row-level security and cryptographically verified JWT memberships.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip label="Personal Workspaces" size="small" sx={{ backgroundColor: 'rgba(0, 63, 92, 0.06)', fontWeight: 500 }} />
                    <Chip label="Company Orgs" size="small" sx={{ backgroundColor: 'rgba(88, 80, 141, 0.08)', fontWeight: 500 }} />
                    <Chip label="Tenant Row Isolation" size="small" sx={{ backgroundColor: 'rgba(188, 80, 144, 0.08)', fontWeight: 500 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: AI Assistant */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF8FA 100%)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(222, 90, 121, 0.1)',
                  },
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'rgba(222, 90, 121, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#DE5A79',
                      mb: 2.5,
                    }}
                  >
                    <SmartToyIcon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#003F5C', mb: 1.5 }}>
                    Embedded AI Copilot
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                    Generate weekly executive reports, auto-summarize complex projects, and get instant task recommendations streamed in real time directly inside your workspace context.
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip label="SSE Streaming" size="small" sx={{ backgroundColor: 'rgba(222, 90, 121, 0.08)', fontWeight: 500 }} />
                    <Chip label="BullMQ Job Queue" size="small" sx={{ backgroundColor: 'rgba(255, 133, 49, 0.08)', fontWeight: 500 }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 3: Projects & Tasks */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(88, 80, 141, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'rgba(88, 80, 141, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#58508D',
                      mb: 2.5,
                    }}
                  >
                    <AssignmentIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#003F5C', mb: 1 }}>
                    Project & Task Lifecycle
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Track deliverables from inception to completion. Manage client associations, assignees, deadlines, and milestone velocity with ease.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 4: Real-Time Collaboration */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0, 63, 92, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'rgba(0, 63, 92, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#003F5C',
                      mb: 2.5,
                    }}
                  >
                    <GroupsIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#003F5C', mb: 1 }}>
                    Team Collaboration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Real-time activity logs, team notifications, and invitation workflows ensure all team members and clients remain synchronized.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 5: Security & Governance */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  backgroundColor: '#FFFFFF',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(255, 99, 97, 0.08)',
                  },
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      backgroundColor: 'rgba(255, 99, 97, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FF6361',
                      mb: 2.5,
                    }}
                  >
                    <ShieldIcon />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#003F5C', mb: 1 }}>
                    Security & RBAC
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    Fine-grained role-based policies (OWNER, ADMIN, MEMBER, VIEWER) and dedicated internal Platform Staff roles (SUPERADMIN, AUDITOR).
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ===================== ARCHITECTURE & API DOCS SECTION ===================== */}
      <Box id="architecture" sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#FFFFFF', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" sx={{ color: '#58508D', fontWeight: 700, letterSpacing: '0.1em' }}>
                ROBUST ARCHITECTURE
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 800, color: '#003F5C', mt: 1, mb: 3, fontSize: { xs: '1.85rem', md: '2.4rem' } }}>
                Modern Full-Stack Engineering
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 4 }}>
                TriFusion AI is built on a high-concurrency NestJS REST and GraphQL backend backed by Neon Serverless PostgreSQL with Prisma ORM, BullMQ background workers, and Next.js 16 with Material UI Design System.
              </Typography>

              <Stack spacing={2.5}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <StorageIcon sx={{ color: '#003F5C', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#003F5C' }}>
                      Neon Serverless PostgreSQL
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connection-pooled cloud PostgreSQL with complete Prisma schema migrations and strict multi-tenant relational constraints.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <HubIcon sx={{ color: '#58508D', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#003F5C' }}>
                      NestJS Enterprise Microservices
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Clean domain-driven module architecture with automated Swagger documentation, input validation pipes, and logging interceptors.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <CodeIcon sx={{ color: '#BC5090', mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#003F5C' }}>
                      Next.js 16 & Material UI App Router
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Emotion SSR hydration, unified design system, zero-FOUC cache provider, and resilient responsive layouts.
                    </Typography>
                  </Box>
                </Box>
              </Stack>

              <Box sx={{ mt: 5, display: 'flex', gap: 2 }}>
                <Button
                  component={Link}
                  href="/register"
                  variant="outlined"
                  startIcon={<ArrowForwardIcon />}
                  sx={{
                    borderColor: '#003F5C',
                    color: '#003F5C',
                    fontWeight: 600,
                    px: 3,
                    py: 1.25,
                    borderRadius: 2,
                  }}
                >
                  Create your workspace
                </Button>
              </Box>
            </Grid>

            {/* Architecture Terminal Mockup */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  backgroundColor: '#0F172A',
                  borderRadius: 3,
                  p: 3,
                  color: '#F8FAFC',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  border: '1px solid #334155',
                }}
              >
                {/* Window header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, pb: 2, borderBottom: '1px solid #1E293B' }}>
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10B981' }} />
                  <Typography variant="caption" sx={{ color: '#94A3B8', ml: 1 }}>
                    trifusion-ai-cluster :: status
                  </Typography>
                </Box>

                <Box sx={{ color: '#38BDF8', mb: 1.5 }}>$ curl -s http://localhost:3001/health</Box>
                <Box sx={{ color: '#E2E8F0', mb: 2, pl: 2, borderLeft: '2px solid #38BDF8' }}>
                  {`{ "status": "ok", "service": "api", "database": "connected", "neon": "ep-purple-haze" }`}
                </Box>

                <Box sx={{ color: '#38BDF8', mb: 1.5 }}>$ pnpm --filter @trifusion/api check:services</Box>
                <Box sx={{ color: '#A7F3D0', mb: 2 }}>
                  ✓ Core Identity & Tenancy Engine: READY<br />
                  ✓ Neon PostgreSQL (aws.neon.tech): ONLINE<br />
                  ✓ Prisma ORM Client v5.22: CONNECTED<br />
                  ✓ REST API (Port 3001): LISTENING<br />
                  ✓ Web Client (Port 3000): READY<br />
                  ✓ Platform Admin (Port 3002): READY
                </Box>

                <Box sx={{ color: '#F472B6' }}>TriFusion AI Ecosystem Ready.</Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ===================== BOTTOM CTA BANNER ===================== */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(135deg, #003F5C 0%, #58508D 50%, #8A508F 100%)',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
            Ready to upgrade your business operations?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, fontSize: '1.1rem' }}>
            Get started with TriFusion AI today. Create personal and company workspaces with enterprise multi-tenancy.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              sx={{
                backgroundColor: '#FFA600',
                color: '#000000',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#FFBA33',
                },
              }}
            >
              Create Account
            </Button>
            <Button
              component={Link}
              href="/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: '#FFFFFF',
                px: 3.5,
                py: 1.5,
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': {
                  borderColor: '#FFFFFF',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
