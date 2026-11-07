'use client';

import { Box, Paper, Skeleton, Stack, Typography } from '@mui/material';

export function PlatformLoadingSkeleton({ title = 'Loading platform data' }: { title?: string }) {
  return (
    <Stack spacing={3} role="status" aria-live="polite" aria-busy="true" sx={{ py: 2 }}>
      <Box>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.4 }}>PLATFORM OPERATIONS</Typography>
        <Typography variant="h5" fontWeight={750}>{title}</Typography>
        <Typography variant="body2" color="text.secondary">Fetching verified records and operational metrics from the platform API…</Typography>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,minmax(0,1fr))', md: 'repeat(4,minmax(0,1fr))' }, gap: 2 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
            <Skeleton width="55%" height={18} />
            <Skeleton width="42%" height={42} sx={{ mt: 1 }} />
            <Skeleton width="70%" height={16} />
          </Paper>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Skeleton width="35%" height={24} />
          <Skeleton variant="rounded" height={260} sx={{ mt: 2, borderRadius: 2 }} />
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Skeleton width="45%" height={24} />
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} height={34} sx={{ my: 1 }} />)}
        </Paper>
      </Box>
    </Stack>
  );
}
