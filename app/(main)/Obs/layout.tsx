import { Box } from '@mui/material'
import LeftsideBar from '@/components/shared/leftsideBar'
import { ThemeProvider } from '../shareContext'

export default function ObserverLayout({
  children
}: {
  children: React.ReactNode
}) {
 return (
  <Box sx={{ display: "flex", flexDirection: "row" }}>
    <LeftsideBar role='OBSERVER' />
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Box sx={{ padding: '32px 12px 32px 32px', paddingTop: '68px', maxWidth: '1400px' }}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </Box>
    </Box>
  </Box>
 )
}