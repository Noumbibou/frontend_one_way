import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  Fade,
  Container,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery
} from "@mui/material";
import { 
  Campaign as CampaignIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import CampaignForm from "../../components/CampaignForm";
import { createCampaign } from "../../services/campaigns";
import "../../components/CampaignForm.css";

const steps = ['Configuration', 'Questions', 'Invitations'];

export default function CreateCampaign() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSubmit = async (payload) => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await createCampaign(payload);
      setSuccess(true);
      setTimeout(() => {
        nav("/recruiter/dashboard", { 
          replace: true, 
          state: { 
            success: "Campagne créée avec succès ! Les invitations seront envoyées aux candidats.",
            campaignId: data.id
          } 
        });
      }, 1500);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.detail ||
                          err?.response?.data || 
                          err?.message || 
                          "Une erreur est survenue lors de la création de la campagne";
      setError(errorMessage);
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    } else {
      nav(-1);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'var(--gradient-violet)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Fade in={true} timeout={1000}>
          <Paper
            className="no-hover-effects"
            elevation={24}
            sx={(theme) => ({
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
              backdropFilter: theme.palette.mode === 'dark' ? 'saturate(120%) blur(10px)' : 'none',
              border: theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid var(--border-color)',
              maxWidth: 500,
              width: '100%'
            })}
          >
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main',
                mb: 3,
                animation: 'pulse 2s infinite'
              }} 
            />
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
              Campagne Créée !
            </Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary', mb: 3 })}>
              Votre campagne a été créée avec succès
            </Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary' })}>
              Redirection vers le tableau de bord...
            </Typography>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'var(--bg-body)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            background: 'var(--gradient-violet-strong)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              fontSize: 200,
              opacity: 0.1,
              transform: 'rotate(15deg)'
            }}
          >
            <CampaignIcon fontSize="inherit" />
          </Box>

          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <CampaignIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" component="h1" sx={(theme) => ({ fontWeight: 700, mb: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' })}>
                Créer une Campagne
              </Typography>
              <Typography variant="body2" sx={(theme) => ({ opacity: 0.9, fontWeight: 400, color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' })}>
                Configurez votre campagne d'entretien et invitez des candidats
              </Typography>
            </Box>
          </Box>

          <Stepper 
            activeStep={activeStep} 
            alternativeLabel
            sx={(theme) => ({ 
              mt: 3,
              '& .MuiStepLabel-label': {
                color: theme.palette.mode === 'dark' ? '#ffffff !important' : 'inherit',
                fontWeight: 500,
                fontSize: '0.9rem'
              },
              '& .MuiStepLabel-label.Mui-active, & .MuiStepLabel-label.Mui-completed': {
                color: theme.palette.mode === 'dark' ? '#ffffff !important' : 'inherit',
              },
              '& .MuiStepIcon-root': {
                color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--brand-primary)',
              },
              '& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed': {
                color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--brand-primary)',
              },
              // Ensure the step number inside the circle is readable in dark mode
              '& .MuiStepIcon-text': {
                fill: theme.palette.mode === 'dark' ? '#0f0f0f' : '#000000',
                fontWeight: 700,
              },
              '& .MuiStepConnector-line': {
                borderColor: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--brand-primary)',
                opacity: 1,
                borderTopWidth: 2,
              }
            })}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Main Content */}
        <Paper
          className="no-hover-effects"
          elevation={16}
          sx={(theme) => ({
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'var(--bg-card)',
            backdropFilter: theme.palette.mode === 'dark' ? 'saturate(120%) blur(10px)' : 'none',
            border: theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid var(--border-color)',
            position: 'relative'
          })}
        >
          {/* Back Button */}
          <Box
            onClick={handleBack}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 3,
              p: 1.5,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'var(--bg-subtle)',
                transform: 'translateX(-4px)'
              }
            }}
          >
            <ArrowBackIcon sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main' })} />
            <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main', fontWeight: 500 })}>
              Retour
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'error.light'
              }}
              onClose={() => setError(null)}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {typeof error === "string" ? error : JSON.stringify(error)}
              </Typography>
            </Alert>
          )}

          {/* Progress Indicator */}
          <Box sx={{ mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary', fontWeight: 500 })}>
                Étape {activeStep + 1} sur {steps.length}
              </Typography>
              <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main', fontWeight: 600 })}>
                {steps[activeStep]}
              </Typography>
            </Box>
            <Box
              sx={{
                width: '100%',
                height: 6,
                background: 'var(--bg-subtle)',
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  width: `${((activeStep + 1) / steps.length) * 100}%`,
                  height: '100%',
                  background: 'var(--gradient-violet)',
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>

          {/* Campaign Form */}
          <CampaignForm 
            onSubmit={handleSubmit} 
            submitting={submitting}
            onStepChange={setActiveStep}
            currentStep={activeStep}
          />

          {/* Help Text */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              background: 'var(--bg-subtle)',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="subtitle1" sx={(theme) => ({ mb: 2, color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main', fontWeight: 600 })}>
              💡 Conseils de création
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2 }}>
              <Typography component="li" variant="body2" sx={(theme) => ({ mb: 1, color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary' })}>
                Utilisez des questions claires et concises
              </Typography>
              <Typography component="li" variant="body2" sx={(theme) => ({ mb: 1, color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary' })}>
                Adaptez le temps de réponse à la complexité des questions
              </Typography>
              <Typography component="li" variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'text.secondary' })}>
                Testez votre campagne avant de l'envoyer aux candidats
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            textAlign: 'center',
            opacity: 0.7
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ✨ Créez des expériences d'entretien mémorables pour vos candidats
          </Typography>
        </Box>
      </Container>

      {/* Global Styles */}
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Box>
  );
}