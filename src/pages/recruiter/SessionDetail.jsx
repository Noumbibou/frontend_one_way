import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Paper, Rating, TextField, Button, Card, CardContent, CardMedia, Tabs, Tab, Divider, IconButton, CircularProgress, TableCell } from '@mui/material';
import { PlayArrow, Pause, SkipPrevious, SkipNext, CheckCircle, Cancel, ThumbUp, ThumbDown } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../../services/api';
import toast from 'react-hot-toast';

const StyledRating = styled(Rating)({
  '& .MuiRating-iconFilled': {
    color: '#3f51b5',
  },
  '& .MuiRating-iconHover': {
    color: '#303f9f',
  },
});

const VideoPlayer = ({ src, autoPlay = false, controls = true }) => {
  // Construire l'URL complète si c'est un chemin relatif
  const getVideoUrl = () => {
    if (!src) return null;
    // Si c'est déjà une URL complète (commence par http ou /)
    if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('/'))) {
      return src;
    }
    // Sinon, construire l'URL complète en supposant que c'est un chemin relatif
    return `http://localhost:8000${src.startsWith('/') ? '' : '/'}${src}`;
  };

  const videoUrl = getVideoUrl();
  
  if (!videoUrl) return <Box p={2}>Aucune vidéo disponible</Box>;
  
  return (
    <Box sx={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
      <video
        key={videoUrl} // Ajout d'une clé pour forcer le rechargement de la vidéo
        controls={controls}
        autoPlay={autoPlay}
        style={{ width: '100%', borderRadius: '8px' }}
      >
        <source src={videoUrl} type="video/mp4" />
        Votre navigateur ne supporte pas la lecture de vidéos.
      </video>
    </Box>
  );
};

const EvaluationForm = ({ videoResponse, onEvaluationSaved }) => {
  console.log('[DEBUG] videoResponse:', videoResponse);
  console.log('[DEBUG] videoResponse.evaluations:', videoResponse?.evaluations);
  console.log('[DEBUG] evaluations length:', videoResponse?.evaluations?.length);
  
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
    // Charger une évaluation existante si elle existe
    if (videoResponse?.evaluations?.length > 0) {
      const existingEval = videoResponse.evaluations[0];
      setEvaluation({
        video_response: videoResponse.id,
        technical_skill: existingEval.technical_skill || 0,
        communication: existingEval.communication || 0,
        motivation: existingEval.motivation || 0,
        cultural_fit: existingEval.cultural_fit || 0,
        notes: existingEval.notes || '',
        recommended: existingEval.recommended
      });
    }
  }, [videoResponse]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier si une évaluation existe déjà
    if (videoResponse?.evaluations?.length > 0) {
      toast.warning("Vous avez déjà évalué cette réponse.");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Créer une copie de l'évaluation
      const evaluationToSubmit = { ...evaluation };
      
      // Arrondir les valeurs décimales des notes
      const ratingFields = ['technical_skill', 'communication', 'motivation', 'cultural_fit'];
      ratingFields.forEach(field => {
        if (evaluationToSubmit[field] !== null && evaluationToSubmit[field] !== undefined) {
          const value = Math.round(Number(evaluationToSubmit[field]));
          evaluationToSubmit[field] = Math.min(5, Math.max(1, value));
        }
      });
      
      console.log("[DEBUG] Données d'évaluation à envoyer (après arrondi):", evaluationToSubmit);
      
      // Vérifications des champs obligatoires
      if (!evaluationToSubmit.video_response) {
        console.error("[ERROR] Aucune réponse vidéo sélectionnée");
        toast.error("Aucune réponse vidéo sélectionnée");
        setIsSubmitting(false);
        return;
      }

      if (evaluationToSubmit.recommended === undefined || evaluationToSubmit.recommended === null) {
        console.error("[ERROR] Le champ 'recommended' est requis");
        toast.error("Veuillez indiquer si vous recommandez ce candidat");
        setIsSubmitting(false);
        return;
      }

      const hasRating = [
        evaluationToSubmit.technical_skill,
        evaluationToSubmit.communication,
        evaluationToSubmit.motivation,
        evaluationToSubmit.cultural_fit
      ].some(rating => rating !== undefined && rating !== null);

      if (!hasRating) {
        console.error("[ERROR] Au moins une note est requise");
        toast.error("Veuillez renseigner au moins une note");
        setIsSubmitting(false);
        return;
      }

      // Création d'une nouvelle évaluation
      console.log("[DEBUG] Envoi de la création de l'évaluation au serveur...");
      await api.post('evaluations/', evaluationToSubmit);
      
      console.log("[DEBUG] Réponse du serveur reçue");
      
      // Mettre à jour l'état local avec la nouvelle évaluation
      onEvaluationSaved();
      toast.success("Évaluation enregistrée avec succès!");
      
    } catch (error) {
      console.error("[ERROR] Erreur lors de la sauvegarde de l'évaluation:", error);
      
      // Afficher les détails de l'erreur s'ils sont disponibles
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         error.message ||
                         'Une erreur est survenue lors de la sauvegarde de l\'évaluation';
      
      console.error("[ERROR] Détails de l'erreur:", error.response?.data);
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
    <Paper elevation={3} sx={{ p: 3, mb: 3, position: 'relative' }}>
      {videoResponse?.evaluations?.length > 0 && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'warning.light',
            color: 'warning.contrastText',
            p: 1.5,
            textAlign: 'center',
            borderRadius: '4px 4px 0 0'
          }}
        >
          <Typography variant="subtitle2">
            Vous avez déjà évalué cette réponse
          </Typography>
        </Box>
      )}
      
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3} sx={{ mt: videoResponse?.evaluations?.length > 0 ? 4 : 0 }}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Évaluer la réponse
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography component="legend">Compétences techniques</Typography>
              <StyledRating
                value={evaluation.technical_skill}
                onChange={(_, value) => handleRatingChange('technical_skill', value)}
                precision={0.5}
              />
            </Box>
            <Box mb={2}>
              <Typography component="legend">Communication</Typography>
              <StyledRating
                value={evaluation.communication}
                onChange={(_, value) => handleRatingChange('communication', value)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box mb={2}>
              <Typography component="legend">Motivation</Typography>
              <StyledRating
                value={evaluation.motivation}
                onChange={(_, value) => handleRatingChange('motivation', value)}
                precision={0.5}
              />
            </Box>
            <Box mb={2}>
              <Typography component="legend">Ajustement culturel</Typography>
              <StyledRating
                value={evaluation.cultural_fit}
                onChange={(_, value) => handleRatingChange('cultural_fit', value)}
                precision={0.5}
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes complémentaires"
              multiline
              rows={4}
              variant="outlined"
              value={evaluation.notes}
              onChange={(e) => handleRatingChange('notes', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography>Recommandation :</Typography>
              <Button
                variant={evaluation.recommended === true ? "contained" : "outlined"}
                color="success"
                startIcon={<ThumbUp />}
                onClick={() => handleRatingChange('recommended', true)}
              >
                Favorable
              </Button>
              <Button
                variant={evaluation.recommended === false ? "contained" : "outlined"}
                color="error"
                startIcon={<ThumbDown />}
                onClick={() => handleRatingChange('recommended', false)}
              >
                Défavorable
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                Note moyenne: <strong>{calculateAverage()}/5</strong>
              </Typography>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || (videoResponse?.evaluations?.length > 0)}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircle />}
                sx={{
                  '&:disabled': {
                    backgroundColor: 'grey.300',
                    color: 'grey.500',
                  },
                }}
              >
                {isSubmitting 
                  ? 'Enregistrement...' 
                  : videoResponse?.evaluations?.length > 0 
                    ? 'Déjà évaluée' 
                    : 'Enregistrer l\'évaluation'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
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
    console.log('handleEvaluationSaved called');
    try {
      console.log('Fetching updated session data...');
      const response = await api.get(`sessions/${id}/`);
      console.log('Updated session data:', response.data);
      
      // Vérifier si les réponses sont bien présentes
      if (response.data.responses) {
        console.log('Responses in updated data:', response.data.responses);
        response.data.responses.forEach((resp, idx) => {
          console.log(`Response ${idx + 1} evaluations:`, resp.evaluations);
        });
      }
      
      setSession(response.data);
      console.log('Session state updated');
    } catch (error) {
      console.error('Erreur lors du rechargement des données:', error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!session) {
    return (
      <Box p={3}>
        <Typography variant="h6">Session introuvable</Typography>
      </Box>
    );
  }

  const currentResponse = session.responses?.[currentResponseIndex] || null;
  const hasMultipleResponses = session.responses?.length > 1;

  return (
    <Box p={3}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Évaluation du candidat
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          {session.candidate_name || session.candidate?.email} - {session.campaign?.title}
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ mb: 3 }}
      >
        <Tab label="Visionnage des réponses" />
        <Tab label="Résumé des évaluations" />
      </Tabs>

      {activeTab === 0 ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                {currentResponse ? (
                  <>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        Question {currentResponseIndex + 1} sur {session.responses.length}
                      </Typography>
                      <Box>
                        <IconButton 
                          onClick={handlePrevResponse} 
                          disabled={currentResponseIndex === 0}
                        >
                          <SkipPrevious />
                        </IconButton>
                        <IconButton 
                          onClick={handleNextResponse} 
                          disabled={currentResponseIndex === session.responses.length - 1}
                        >
                          <SkipNext />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle1" paragraph>
                      <strong>Question :</strong> {currentResponse.question_text}
                    </Typography>
                    
                    <Box mb={3}>
                      <VideoPlayer 
                        src={currentResponse.video_file || currentResponse.video_url} 
                        autoPlay={false} 
                        controls={true} 
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" color="textSecondary">
                        Durée : {currentResponse.duration} secondes
                      </Typography>
                      {currentResponse.evaluations?.length > 0 && (
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            Évalué par : {currentResponse.evaluations[0].hiring_manager_name}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Évalué
                          </Typography>
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            ({currentResponse.evaluations[0].overall_score}/5)
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                ) : (
                  <Typography>Aucune réponse disponible pour cette session.</Typography>
                )}
              </CardContent>
            </Card>

            {currentResponse && (
              <EvaluationForm 
                videoResponse={currentResponse} 
                onEvaluationSaved={handleEvaluationSaved} 
              />
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Détails du candidat
                </Typography>
                <Box mb={2}>
                  <Typography variant="subtitle2">Nom complet</Typography>
                  <Typography variant="body1">
                    {session.candidate_name || 'Non spécifié'}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">
                    {session.candidate?.email || 'Non spécifié'}
                  </Typography>
                </Box>
                <Box mb={2}>
                  <Typography variant="subtitle2">Téléphone</Typography>
                  <Typography variant="body1">
                    {session.candidate?.phone || 'Non spécifié'}
                  </Typography>
                </Box>
                {session.candidate?.linkedin_url && (
                  <Box mb={2}>
                    <Typography variant="subtitle2">Profil LinkedIn</Typography>
                    <a 
                      href={session.candidate.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                    >
                      Voir le profil
                    </a>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2">Statut de la session</Typography>
                <Box 
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    bgcolor: session.status === 'completed' ? '#e8f5e9' : '#fff8e1',
                    color: session.status === 'completed' ? '#2e7d32' : '#f57f17',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    mt: 1
                  }}
                >
                  {session.status === 'completed' ? (
                    <>
                      <CheckCircle fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">Terminé</Typography>
                    </>
                  ) : (
                    <>
                      <Cancel fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">En cours</Typography>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Navigation rapide
                </Typography>
                <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {session.responses?.map((response, index) => (
                    <Box 
                      key={response.id}
                      onClick={() => setCurrentResponseIndex(index)}
                      sx={{
                        p: 1.5,
                        mb: 1,
                        borderRadius: 1,
                        cursor: 'pointer',
                        bgcolor: currentResponseIndex === index ? 'action.hover' : 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">Question {index + 1}</Typography>
                        {response.evaluations?.length > 0 ? (
                          <Typography variant="caption" color="success.main">
                            Évalué
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="textSecondary">
                            Non évalué
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Résumé des évaluations
            </Typography>
            {session.responses?.length > 0 ? (
              session.responses.map((response, index) => (
                <Box key={response.id} mb={3} pb={2} borderBottom="1px solid #eee">
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Question {index + 1}:</strong> {response.question_text}
                  </Typography>
                  {response.evaluations?.length > 0 ? (
                    <Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ minWidth: '120px' }}>Compétences techniques:</Typography>
                        <Rating value={response.evaluations[0].technical_skill} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1 }}>({response.evaluations[0].technical_skill})</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ minWidth: '120px' }}>Communication:</Typography>
                        <Rating value={response.evaluations[0].communication} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1 }}>({response.evaluations[0].communication})</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ minWidth: '120px' }}>Motivation:</Typography>
                        <Rating value={response.evaluations[0].motivation} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1 }}>({response.evaluations[0].motivation})</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ minWidth: '120px' }}>Ajustement culturel:</Typography>
                        <Rating value={response.evaluations[0].cultural_fit} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1 }}>({response.evaluations[0].cultural_fit})</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Typography variant="body2" sx={{ minWidth: '120px' }}>Recommandation:</Typography>
                        {response.evaluations[0].recommended === true ? (
                          <Box display="flex" alignItems="center" color="success.main">
                            <ThumbUp fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography>Favorable</Typography>
                          </Box>
                        ) : response.evaluations[0].recommended === false ? (
                          <Box display="flex" alignItems="center" color="error.main">
                            <ThumbDown fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography>Défavorable</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">Non spécifié</Typography>
                        )}
                      </Box>
                      {response.evaluations[0].notes && (
                        <Box mt={1}>
                          <Typography variant="subtitle2">Notes:</Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                            {response.evaluations[0].notes}
                          </Typography>
                        </Box>
                      )}
                      <Box mt={1} display="flex" justifyContent="flex-end">
                        <Typography variant="caption" color="textSecondary">
                          Évalué par {response.evaluations[0].hiring_manager_name} le{' '}
                          {new Date(response.evaluations[0].evaluated_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary" fontStyle="italic">
                      Non évalué
                    </Typography>
                  )}
                </Box>
              ))
            ) : (
              <Typography variant="body1" color="textSecondary">
                Aucune réponse n'a encore été évaluée.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default SessionDetail;