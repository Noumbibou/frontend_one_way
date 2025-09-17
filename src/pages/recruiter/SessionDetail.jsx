import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Grid, Paper, Rating, TextField, Button, Card, 
  CardContent, Tabs, Tab, Divider, IconButton, CircularProgress,
  Chip, Avatar, LinearProgress, Tooltip, Fade
} from '@mui/material';
import { 
  PlayArrow, Pause, SkipPrevious, SkipNext, CheckCircle, Cancel, 
  ThumbUp, ThumbDown, Person, Email, Phone, LinkedIn, 
  Assessment, VideoLibrary, Star, Notes
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../../services/api';
import toast from 'react-hot-toast';

// Styles personnalisés (full‑dark + glass)
const GradientPaper = styled(Paper)(({ theme }) => ({
  background: 'var(--bg-subtle)',
  color: 'var(--text-primary)',
  padding: theme.spacing(3),
  borderRadius: '20px',
  marginBottom: theme.spacing(4),
  border: theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid var(--border-color)',
  position: 'relative'
}));

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#ff6b35',
  },
  '& .MuiRating-iconHover': {
    color: '#ff8c66',
  },
});

const GlassCard = styled(Card)(({ theme }) => ({
  background: 'var(--bg-subtle)',
  borderRadius: '20px',
  border: theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid var(--border-color)',
  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
  transition: 'all 0.3s ease',
  color: 'var(--text-on-card)',
  '&:hover': theme.palette.mode === 'dark'
    ? { /* disable hover effects in dark mode */ }
    : {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
      },
}));

const NavigationButton = styled(IconButton)(({ theme }) => ({
  background: 'var(--gradient-violet)',
  color: 'white',
  '&:hover': {
    background: 'var(--gradient-violet-strong)',
    transform: 'scale(1.1)',
  },
  '&:disabled': {
    background: 'var(--bg-subtle)',
    color: 'var(--text-secondary)',
  },
}));

const VideoPlayer = ({ src, autoPlay = false, controls = true }) => {
  const getVideoUrl = () => {
    if (!src) return null;
    if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('/'))) {
      return src;
    }
    return `http://localhost:8000${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const videoUrl = getVideoUrl();
  
  if (!videoUrl) return (
    <Box sx={{ 
      width: '100%', 
      height: '400px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-body) 0%, var(--bg-subtle) 100%)',
      borderRadius: '16px'
    }}>
      <Typography variant="h6" color="textSecondary">
        Aucune vidéo disponible
      </Typography>
    </Box>
  );
  
  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '800px', 
      margin: '0 auto',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
    }}>
      <video
        key={videoUrl}
        controls={controls}
        autoPlay={autoPlay}
        style={{ 
          width: '100%', 
          height: '400px',
          objectFit: 'cover'
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </Box>
  );
};

const EvaluationForm = ({ videoResponse, onEvaluationSaved }) => {
  const [evaluation, setEvaluation] = useState({
    video_response: videoResponse?.id || null,
    technical_skill: 0,
    communication: 0,
    motivation: 0,
    cultural_fit: 0,
    notes: '',
    recommended: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (videoResponse?.id) {
      let next = {
        video_response: videoResponse.id,
        technical_skill: 0,
        communication: 0,
        motivation: 0,
        cultural_fit: 0,
        notes: '',
        recommended: null,
      };

      if (videoResponse?.evaluations?.length > 0) {
        const existingEval = videoResponse.evaluations[0];
        next = {
          ...next,
          technical_skill: existingEval.technical_skill || 0,
          communication: existingEval.communication || 0,
          motivation: existingEval.motivation || 0,
          cultural_fit: existingEval.cultural_fit || 0,
          notes: existingEval.notes || '',
          recommended: existingEval.recommended,
        };
      }

      setEvaluation(next);
    }
  }, [videoResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const evaluationToSubmit = { ...evaluation };
      const ratingFields = ['technical_skill', 'communication', 'motivation', 'cultural_fit'];
      ratingFields.forEach(field => {
        if (evaluationToSubmit[field] !== null && evaluationToSubmit[field] !== undefined) {
          const value = Math.round(Number(evaluationToSubmit[field]));
          evaluationToSubmit[field] = Math.min(5, Math.max(1, value));
        }
      });
      
      if (!evaluationToSubmit.video_response) {
        toast.error("Aucune réponse vidéo sélectionnée");
        return;
      }

      if (evaluationToSubmit.recommended === undefined || evaluationToSubmit.recommended === null) {
        toast.error("Veuillez indiquer si vous recommandez ce candidat");
        return;
      }

      const hasRating = [
        evaluationToSubmit.technical_skill,
        evaluationToSubmit.communication,
        evaluationToSubmit.motivation,
        evaluationToSubmit.cultural_fit
      ].some(rating => rating !== undefined && rating !== null);

      if (!hasRating) {
        toast.error("Veuillez renseigner au moins une note");
        return;
      }

      await api.post('evaluations/', evaluationToSubmit);
      onEvaluationSaved();
      toast.success("Évaluation enregistrée avec succès!");
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message ||
                         'Une erreur est survenue lors de la sauvegarde de l\'évaluation';
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (field, value) => {
    setEvaluation(prev => ({ ...prev, [field]: value }));
  };

  const calculateAverage = () => {
    const { technical_skill, communication, motivation, cultural_fit } = evaluation;
    const scores = [technical_skill, communication, motivation, cultural_fit].filter(Boolean);
    return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
  };

  return (
    <GlassCard sx={{ p: 3, mb: 3, position: 'relative' }}>
      {videoResponse?.evaluations?.length > 0 && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
            color: 'white',
            p: 1.5,
            textAlign: 'center',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Typography variant="subtitle2" fontWeight="600">
            ✓ Vous avez déjà évalué cette réponse
          </Typography>
        </Box>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} sx={{ mt: videoResponse?.evaluations?.length > 0 ? 4 : 0 }}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Assessment sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="600">
                Évaluation de la réponse
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            {[
              { label: "Compétences techniques", field: "technical_skill" },
              { label: "Communication", field: "communication" },
              { label: "Motivation", field: "motivation" },
              { label: "Ajustement culturel", field: "cultural_fit" }
            ].map((item, index) => (
              <Box key={item.field} mb={3}>
                <Typography component="legend" fontWeight="500" mb={1}>
                  {item.label}
                </Typography>
                <StyledRating
                  value={evaluation[item.field]}
                  onChange={(_, value) => handleRatingChange(item.field, value)}
                  precision={0.5}
                  size="large"
                />
              </Box>
            ))}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={3}>
              <Typography fontWeight="500" mb={2}>
                Recommandation :
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant={evaluation.recommended === true ? "contained" : "outlined"}
                  color="success"
                  startIcon={<ThumbUp />}
                  onClick={() => handleRatingChange('recommended', true)}
                  sx={{ borderRadius: '12px', px: 3 }}
                >
                  Favorable
                </Button>
                <Button
                  variant={evaluation.recommended === false ? "contained" : "outlined"}
                  color="error"
                  startIcon={<ThumbDown />}
                  onClick={() => handleRatingChange('recommended', false)}
                  sx={{ borderRadius: '12px', px: 3 }}
                >
                  Défavorable
                </Button>
              </Box>
            </Box>

            <Box mb={3}>
              <Typography fontWeight="500" mb={1}>
                Notes complémentaires
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                value={evaluation.notes}
                onChange={(e) => handleRatingChange('notes', e.target.value)}
                placeholder="Partagez vos observations sur cette réponse..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box p={2} sx={{
              background: 'var(--bg-subtle)',
              borderRadius: '16px'
            }}>
              <Box display="flex" justifyContent={{ xs: 'center', md: 'space-between' }} alignItems="center" flexWrap="wrap" gap={2}>
                <Box textAlign={{ xs: 'center', md: 'left' }}>
                  <Typography variant="body2" color="textSecondary">
                    Note moyenne
                  </Typography>
                  <Typography variant="h5" fontWeight="700" color="primary.main">
                    {calculateAverage()}/5
                  </Typography>
                </Box>
                <Box ml="auto">
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
                    sx={{
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      fontSize: '1rem',
                      backgroundColor: '#000',
                      color: '#fff',
                      '&:hover': { filter: 'brightness(0.9)' }
                    }}
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Sauvegarder'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </form>
    </GlassCard>
  );
};

const SessionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`sessions/${id}/`);
        setSession(response.data);
        setCurrentResponseIndex(0);
      } catch (error) {
        console.error('Erreur lors du chargement de la session:', error);
        toast.error('Erreur lors du chargement de la session');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleNextResponse = () => {
    if (session?.responses && currentResponseIndex < session.responses.length - 1) {
      setCurrentResponseIndex(prev => prev + 1);
    }
  };

  const handlePrevResponse = () => {
    if (currentResponseIndex > 0) {
      setCurrentResponseIndex(prev => prev - 1);
    }
  };

  const handleEvaluationSaved = async () => {
    try {
      const response = await api.get(`sessions/${id}/`);
      setSession(response.data);
      toast.success('Évaluation mise à jour avec succès!');
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <Box textAlign="center">
          <CircularProgress size={60} thickness={4} sx={{ color: 'var(--brand-primary)', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">
            Chargement de la session...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!session) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h4" color="error" gutterBottom>
          Session introuvable
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Retour
        </Button>
      </Box>
    );
  }

  const currentResponse = session.responses?.[currentResponseIndex] || null;
  const hasMultipleResponses = session.responses?.length > 1;
  const totalEvaluated = session.responses?.filter(r => r.evaluations?.length > 0).length || 0;
  const progressPercentage = session.responses?.length ? (totalEvaluated / session.responses.length) * 100 : 0;

  return (
    <Box className="no-hover-effects" sx={{ p: 3, background: 'var(--bg-body)', minHeight: '100vh', color: 'var(--text-primary)' }}>
      {session.status === 'cancelled' && (
        <Paper elevation={0} sx={{ mb: 2, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'warning.light', background: 'rgba(255, 193, 7, 0.08)' }}>
          <Typography variant="body2" color="warning.dark" fontWeight={600}>
            Cette session a été annulée (lien expiré/invalide et réponses incomplètes)
          </Typography>
        </Paper>
      )}
      {session.status === 'expired' && (
        <Paper elevation={0} sx={{ mb: 2, p: 2, borderRadius: '12px', border: '1px solid', borderColor: 'error.light', background: 'rgba(244, 67, 54, 0.08)' }}>
          <Typography variant="body2" color="error.dark" fontWeight={600}>
            Cette session a expiré. Les évaluations sont désactivées.
          </Typography>
        </Paper>
      )}
      {/* Header Section */}
      <GradientPaper>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={3}>
          <Box>
            <Typography variant="h4" fontWeight="700" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Évaluation du Candidat
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9, color: 'var(--text-primary)' }}>
              {session.candidate_name || session.candidate?.email}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, color: 'var(--text-primary)' }}>
              {session.campaign?.title}
            </Typography>
          </Box>
          
          <Box textAlign="right">
            {(() => {
              const map = {
                completed: { label: 'Terminé', color: 'success' },
                cancelled: { label: 'Annulé', color: 'error' },
                expired:   { label: 'Expiré', color: 'error' },
                in_progress: { label: 'En cours', color: 'warning' },
                invited: { label: 'Invité', color: 'default' },
              };
              const s = String(session.status || '').toLowerCase();
              const cfg = map[s] || { label: s || '—', color: 'default' };
              return (
                <Chip
                  label={cfg.label}
                  color={cfg.color}
                  sx={{ fontSize: '1rem', px: 2, py: 1, fontWeight: '600' }}
                />
              );
            })()}
            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9, color: 'var(--text-primary)' }}>
              Progression: {totalEvaluated}/{session.responses?.length} réponses évaluées
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progressPercentage} 
              sx={{ 
                mt: 1, 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                '& .MuiLinearProgress-bar': {
                  background: 'var(--gradient-blue)'
                }
              }}
            />
          </Box>
        </Box>
      </GradientPaper>

      {/* Tabs Section */}
      <Paper sx={{ mb: 3, borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab 
            icon={<VideoLibrary />} 
            label="Visionnage des réponses" 
            sx={{ fontSize: '1rem', py: 2 }}
          />
          <Tab 
            icon={<Assessment />} 
            label="Résumé des évaluations" 
            sx={{ fontSize: '1rem', py: 2 }}
          />
        </Tabs>
      </Paper>

      {activeTab === 0 ? (
        <Grid container spacing={3}>
          {/* Main Content Column */}
          <Grid item xs={12} lg={8}>
            {/* Video Player Card */}
            <GlassCard>
              <CardContent>
                {currentResponse ? (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Box>
                        <Typography variant="h6" fontWeight="600" gutterBottom>
                          Question {currentResponseIndex + 1} sur {session.responses.length}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                          {currentResponse.question_text}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" gap={1}>
                        <NavigationButton 
                          onClick={handlePrevResponse} 
                          disabled={currentResponseIndex === 0}
                        >
                          <SkipPrevious />
                        </NavigationButton>
                        <NavigationButton 
                          onClick={handleNextResponse} 
                          disabled={currentResponseIndex === session.responses.length - 1}
                        >
                          <SkipNext />
                        </NavigationButton>
                      </Box>
                    </Box>
                    
                    <Box mb={3}>
                      <VideoPlayer 
                        src={currentResponse.video_file || currentResponse.video_url} 
                        autoPlay={false} 
                        controls={true} 
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                      <Chip
                        icon={<PlayArrow />}
                        label={`Durée: ${currentResponse.duration}s`}
                        variant="outlined"
                      />
                      
                      {currentResponse.evaluations?.length > 0 && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            icon={<CheckCircle />}
                            label="Évalué"
                            color="success"
                            variant="filled"
                          />
                          <Typography variant="body2" sx={{ color: 'var(--text-primary)' }}>
                            Par {currentResponse.evaluations[0].hiring_manager_name}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <Box textAlign="center" py={6}>
                    <VideoLibrary sx={{ fontSize: 60, color: 'var(--text-primary)', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                      Aucune réponse disponible
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </GlassCard>

            {/* Evaluation Form */}
            {currentResponse && (session.status === 'cancelled' || session.status === 'expired') ? (
              <GlassCard sx={{ p: 3, mb: 3 }}>
                <Typography variant="body2" sx={{ color: 'var(--text-on-card)' }}>
                  L'évaluation est désactivée pour cette session ({session.status}).
                </Typography>
              </GlassCard>
            ) : currentResponse ? (
              <EvaluationForm 
                videoResponse={currentResponse} 
                onEvaluationSaved={handleEvaluationSaved} 
              />
            ) : null}
          </Grid>

          {/* Sidebar Column */}
          <Grid item xs={12} lg={4}>
            {/* Candidate Info Card */}
            <GlassCard sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'var(--text-on-card)' }}>
                  <Person /> Informations du Candidat
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Person sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight="500">Nom complet</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'var(--text-on-card)' }}>
                    {session.candidate_name || 'Non spécifié'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Email sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight="500">Email</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'var(--text-on-card)' }}>
                    {session.candidate?.email || 'Non spécifié'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Phone sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight="500">Téléphone</Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'var(--text-on-card)' }}>
                    {session.candidate?.phone || 'Non spécifié'}
                  </Typography>
                </Box>

                {session.candidate?.linkedin_url && (
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LinkedIn sx={{ color: 'primary.main' }} />
                      <Typography variant="body2" fontWeight="500">LinkedIn</Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      href={session.candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<LinkedIn />}
                      sx={{ borderRadius: '12px' }}
                    >
                      Voir le profil
                    </Button>
                  </Box>
                )}
              </CardContent>
            </GlassCard>

            {/* Navigation Card */}
            <GlassCard>
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'var(--text-on-card)' }}>
                  <Notes /> Navigation Rapide
                </Typography>
                
                <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {session.responses?.map((response, index) => (
                    <Box 
                      key={response.id}
                      onClick={() => setCurrentResponseIndex(index)}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        background: currentResponseIndex === index ? 
                          'var(--gradient-violet)' : 
                          'rgba(255,255,255,0.06)',
                        color: currentResponseIndex === index ? 'white' : 'var(--text-on-card)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateX(4px)',
                          background: currentResponseIndex === index ? 
                            'var(--gradient-violet-strong)' : 
                            'rgba(255,255,255,0.08)',
                        }
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="500">
                          Question {index + 1}
                        </Typography>
                        {response.evaluations?.length > 0 ? (
                          <Chip
                            icon={<CheckCircle />}
                            label="Évalué"
                            size="small"
                            color="success"
                            sx={{ 
                              color: currentResponseIndex === index ? 'white' : 'inherit',
                              backgroundColor: currentResponseIndex === index ? 'rgba(255, 255, 255, 0.2)' : 'success.light'
                            }}
                          />
                        ) : (
                          <Chip
                            label="Non évalué"
                            size="small"
                            color="default"
                            sx={{ 
                              color: currentResponseIndex === index ? 'white' : 'inherit',
                              backgroundColor: currentResponseIndex === index ? 'rgba(255, 255, 255, 0.2)' : 'grey.100'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </GlassCard>
          </Grid>
        </Grid>
      ) : (
        /* Evaluation Summary Tab */
        <GlassCard>
          <CardContent>
            <Typography variant="h6" fontWeight="600" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment /> Résumé des Évaluations
            </Typography>
            
            {session.responses?.length > 0 ? (
              session.responses.map((response, index) => (
                <Box key={response.id} mb={4} pb={3} sx={{ 
                  borderBottom: '2px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none' }
                }}>
                  <Typography variant="subtitle1" fontWeight="600" gutterBottom color="primary">
                    Question {index + 1}: {response.question_text}
                  </Typography>
                  
                  {response.evaluations?.length > 0 ? (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {[
                          { label: "Compétences techniques", value: response.evaluations[0].technical_skill },
                          { label: "Communication", value: response.evaluations[0].communication },
                          { label: "Motivation", value: response.evaluations[0].motivation },
                          { label: "Ajustement culturel", value: response.evaluations[0].cultural_fit }
                        ].map((item) => (
                          <Box key={item.label} mb={2}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" fontWeight="500">
                                {item.label}
                              </Typography>
                              <Typography variant="body2" fontWeight="600" color="primary">
                                {item.value}/5
                              </Typography>
                            </Box>
                            <Rating value={item.value} readOnly precision={0.5} size="small" />
                          </Box>
                        ))}
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box mb={2}>
                          <Typography variant="body2" fontWeight="500" gutterBottom>
                            Recommandation
                          </Typography>
                          {response.evaluations[0].recommended === true ? (
                            <Chip
                              icon={<ThumbUp />}
                              label="Favorable"
                              color="success"
                              variant="filled"
                            />
                          ) : response.evaluations[0].recommended === false ? (
                            <Chip
                              icon={<ThumbDown />}
                              label="Défavorable"
                              color="error"
                              variant="filled"
                            />
                          ) : (
                            <Typography variant="body2" color="textSecondary">
                              Non spécifié
                            </Typography>
                          )}
                        </Box>
                        
                        {response.evaluations[0].notes && (
                          <Box>
                            <Typography variant="body2" fontWeight="500" gutterBottom>
                              Notes
                            </Typography>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px' }}>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                                {response.evaluations[0].notes}
                              </Typography>
                            </Paper>
                          </Box>
                        )}
                      </Grid>
                    </Grid>
                  ) : (
                    <Box textAlign="center" py={3}>
                      <Typography variant="body2" color="textSecondary" fontStyle="italic">
                        Cette réponse n'a pas encore été évaluée
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))
            ) : (
              <Box textAlign="center" py={6}>
                <Assessment sx={{ fontSize: 60, color: 'var(--text-primary)', mb: 2 }} />
                <Typography variant="h6" sx={{ color: 'var(--text-primary)' }}>
                  Aucune réponse à évaluer
                </Typography>
              </Box>
            )}
          </CardContent>
        </GlassCard>
      )}
    </Box>
  );
};

export default SessionDetail;