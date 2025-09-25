import React, { useMemo, useState } from "react";
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  IconButton, 
  Switch, 
  FormControlLabel,
  Paper,
  Chip,
  Divider,
  Tooltip,
  Fade,
  Grid,
  InputAdornment
} from "@mui/material";
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as TimeIcon,
  PriorityHigh as RequiredIcon,
  HelpOutline as HelpIcon,
  Title as TitleIcon,
  Description as DescriptionIcon,
  CalendarToday as CalendarIcon
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";

// Styles personnalisés
const GlassPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'var(--bg-card)',
  backdropFilter: theme.palette.mode === 'dark' ? 'saturate(120%) blur(10px)' : 'none',
  borderRadius: '20px',
  border: theme.palette.mode === 'dark' ? '1px solid #ffffff' : '1px solid var(--border-color)',
  boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.08)',
  padding: theme.spacing(4),
  marginBottom: theme.spacing(3),
  color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-on-card)',
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
  border: 'none',
  borderRadius: '12px',
  padding: '12px 24px',
  fontWeight: 600,
  color: '#fff',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(167, 139, 250, 0.3)',
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
    transform: 'none',
    boxShadow: 'none',
  },
}));

const QuestionCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-subtle) 100%)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  border: '2px solid transparent',
  transition: 'all 0.3s ease',
  '&:hover': theme.palette.mode === 'dark'
    ? { /* disable hover effects in dark mode */ }
    : {
        borderColor: theme.palette.primary.main,
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(167, 139, 250, 0.25)',
      },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '&& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'var(--bg-card)',
    color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
    caretColor: theme.palette.mode === 'dark' ? '#ffffff' : 'auto',
    '& .MuiOutlinedInput-input, & .MuiInputBase-input, & input, & textarea': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
      caretColor: theme.palette.mode === 'dark' ? '#ffffff' : 'auto',
      backgroundColor: 'transparent !important',
      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
      '::placeholder': {
        color: theme.palette.mode === 'dark' ? '#cbd5e1' : 'var(--text-secondary)',
        opacity: 0.9,
      },
    },
    '& .MuiInputBase-inputMultiline, & textarea': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
    },
    '& input[type="datetime-local"]': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
      backgroundColor: 'transparent !important',
    },
    '& input[type="datetime-local"]::-webkit-datetime-edit': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
    },
    '& input[type="datetime-local"]::-webkit-calendar-picker-indicator': {
      filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
      opacity: 0.9,
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
    },
    // Autofill fixes for dark mode
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus': {
      WebkitTextFillColor: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
      WebkitBoxShadow: theme.palette.mode === 'dark' ? '0 0 0px 1000px rgba(255,255,255,0.06) inset' : '0 0 0px 1000px var(--bg-card) inset',
      transition: 'background-color 5000s ease-in-out 0s',
    },
    '& input, & textarea': {
      WebkitBoxShadow: '0 0 0px 1000px transparent inset',
    },
    '& input[type="number"]': {
      MozAppearance: 'textfield',
    },
    '& input[type="number"]::-webkit-outer-spin-button, & input[type="number"]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      boxShadow: '0 0 0 3px rgba(167, 139, 250, 0.2)',
    },
  },
  '& .MuiFormHelperText-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-secondary)',
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--text-primary)',
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : 'var(--brand-primary)',
  },
}));

export default function CampaignForm({ initial = {}, onSubmit, submitting, onStepChange, currentStep }) {
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [preparationTime, setPreparationTime] = useState(initial.preparation_time ?? 30);
  const [responseTimeLimit, setResponseTimeLimit] = useState(initial.response_time_limit ?? 120);
  const [maxQuestions, setMaxQuestions] = useState(initial.max_questions ?? 5);
  const [allowRetry, setAllowRetry] = useState(initial.allow_retry ?? false);
  const toLocalInput = (d) => {
    // format as YYYY-MM-DDTHH:MM for input[type=datetime-local]
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hour = pad(d.getHours());
    const minute = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hour}:${minute}`;
  };
  const nowLocalStr = useMemo(() => toLocalInput(new Date()), []);
  const [startDate, setStartDate] = useState(initial.start_date || nowLocalStr);
  const [endDate, setEndDate] = useState(initial.end_date || "");
  const [questions, setQuestions] = useState(
    initial.questions && initial.questions.length
      ? initial.questions.map((q, i) => ({
          text: q.text ?? q.prompt ?? "",
          order: q.order ?? i + 1,
          preparation_time: q.preparation_time ?? 30,
          response_time_limit: q.response_time_limit ?? 120,
          is_required: q.is_required ?? true,
        }))
      : [
          { text: "", order: 1, preparation_time: 30, response_time_limit: 120, is_required: true },
        ]
  );

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { text: "", order: questions.length + 1, preparation_time: 30, response_time_limit: 120, is_required: true },
    ]);
  };

  const removeQuestion = (i) => {
    if (questions.length > 1) {
      const copy = questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 }));
      setQuestions(copy);
    }
  };

  const setQuestionField = (i, key, value) => {
    const copy = [...questions];
    copy[i] = { ...copy[i], [key]: value };
    setQuestions(copy);
  };

  const validate = () => {
    const missing = [];
    const num = (v) => Number(v);
    if (!title.trim()) missing.push("Intitulé de la campagne");
    if (!description.trim()) missing.push("Description");
    if (!preparationTime && preparationTime !== 0) missing.push("Temps de préparation");
    if (!responseTimeLimit && responseTimeLimit !== 0) missing.push("Temps de réponse");
    if (!maxQuestions && maxQuestions !== 0) missing.push("Nombre maximum de questions");
    if (!startDate) missing.push("Date de début");
    if (!endDate) missing.push("Date de fin");

    // Numeric checks
    if (!(num(preparationTime) > 0)) missing.push("Temps de préparation (doit être > 0)");
    if (!(num(responseTimeLimit) > 0)) missing.push("Temps de réponse (doit être > 0)");
    if (!(num(maxQuestions) >= 1)) missing.push("Nombre maximum de questions (>= 1)");

    // Date logic
    // start >= now
    if (startDate) {
      const s = new Date(startDate);
      const now = new Date();
      if (isNaN(s.getTime()) || s < now) {
        missing.push("La date de début doit être postérieure à maintenant");
      }
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) {
        missing.push("Plage de dates valide (fin après début)");
      }
    }

    // Questions
    if (!questions.length) missing.push("Au moins une question");
    questions.forEach((q, i) => {
      if (!q.text || !q.text.trim()) missing.push(`Question ${i + 1} (texte obligatoire)`);
      if (!(num(q.preparation_time) > 0)) missing.push(`Question ${i + 1} - temps préparation (> 0)`);
      if (!(num(q.response_time_limit) > 0)) missing.push(`Question ${i + 1} - temps réponse (> 0)`);
    });

    if (missing.length) {
      alert(
        "Veuillez corriger les éléments suivants avant de créer la campagne:\n\n- " +
          missing.join("\n- ")
      );
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Only confirm on the final review step
    if (currentStep === 2) {
      if (!validate()) return;
      const confirmed = window.confirm(
        "Avant de créer cette campagne, veuillez vérifier minutieusement tous les détails. " +
        "Une fois créée, elle ne pourra plus être modifiée ni supprimée. Confirmez-vous la création ?"
      );
      if (!confirmed) return;
    }

    const payload = {
      title: title.trim(),
      description: description || "",
      preparation_time: Number(preparationTime) || 30,
      response_time_limit: Number(responseTimeLimit) || 120,
      max_questions: Number(maxQuestions) || 5,
      allow_retry: !!allowRetry,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      questions: questions.map((q, idx) => ({
        text: q.text?.trim() || "",
        order: q.order ?? idx + 1,
        preparation_time: Number(q.preparation_time) || 30,
        response_time_limit: Number(q.response_time_limit) || 120,
        is_required: !!q.is_required,
      })),
    };
    onSubmit && onSubmit(payload);
  };

  const handleNext = () => {
    if (currentStep < 2) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {/* Configuration Section */}
      {currentStep === 0 && (
        <Fade in={true} timeout={500}>
          <GlassPaper elevation={0}>
            <Typography variant="h5" gutterBottom sx={(theme) => ({ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main' })}>
              <TitleIcon /> Configuration de la campagne
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Intitulé de la campagne"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Donnez un nom clair et descriptif à votre campagne"
                />
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  multiline
                  rows={3}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Décrivez l'objectif et le contexte de cette campagne"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Temps de préparation (secondes)"
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">s</InputAdornment>,
                  }}
                  helperText="Temps alloué pour préparer chaque réponse"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Temps de réponse (secondes)"
                  value={responseTimeLimit}
                  onChange={(e) => setResponseTimeLimit(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TimeIcon color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: <InputAdornment position="end">s</InputAdornment>,
                  }}
                  helperText="Durée maximale pour chaque réponse vidéo"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  type="number"
                  label="Nombre maximum de questions"
                  value={maxQuestions}
                  onChange={(e) => setMaxQuestions(e.target.value)}
                  inputProps={{ min: 1, max: 20 }}
                  required
                  helperText="Limite du nombre de questions par campagne"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={allowRetry}
                      onChange={(e) => setAllowRetry(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      Autoriser les nouvelles tentatives
                      <Tooltip title="Permet aux candidats de refaire l'entretien">
                        <HelpIcon fontSize="small" color="action" />
                      </Tooltip>
                    </Box>
                  }
                  sx={{ mt: 2 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  type="datetime-local"
                  label="Date de début"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="primary" />
                      </InputAdornment>
                    ),
                    inputProps: { min: nowLocalStr },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <StyledTextField
                  fullWidth
                  type="datetime-local"
                  label="Date de fin"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="primary" />
                      </InputAdornment>
                    ),
                    inputProps: { min: startDate || nowLocalStr },
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
              <Button onClick={handlePrevious} disabled={currentStep === 0} sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })}>
                Retour
              </Button>
              <Button variant="contained" onClick={handleNext}>
                Suivant: Questions
              </Button>
            </Box>
          </GlassPaper>
        </Fade>
      )}

      {/* Questions Section */}
      {currentStep === 1 && (
        <Fade in={true} timeout={500}>
          <GlassPaper elevation={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={(theme) => ({ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main' })}>
                <DescriptionIcon /> Questions de l'entretien
              </Typography>
              <Chip 
                label={`${questions.length} question(s)`} 
                color="primary" 
                variant="outlined"
                sx={(theme) => ({
                  color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                  borderColor: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                })}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {questions.map((q, i) => (
              <QuestionCard key={i} elevation={0}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Chip 
                    label={`Question ${i + 1}`} 
                    color="primary" 
                    variant="filled"
                    size="small"
                  />
                  {questions.length > 1 && (
                    <Tooltip title="Supprimer cette question">
                      <IconButton 
                        onClick={() => removeQuestion(i)} 
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                <StyledTextField
                  fullWidth
                  value={q.text}
                  onChange={(e) => setQuestionField(i, "text", e.target.value)}
                  placeholder={`Écrivez votre question ${i + 1} ici...`}
                  multiline
                  rows={3}
                  required
                  helperText="Formulez une question claire et précise"
                />

                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={4}>
                    <StyledTextField
                      fullWidth
                      type="number"
                      label="Temps préparation"
                      value={q.preparation_time}
                      onChange={(e) => setQuestionField(i, "preparation_time", e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">s</InputAdornment>,
                      }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <StyledTextField
                      fullWidth
                      type="number"
                      label="Temps réponse"
                      value={q.response_time_limit}
                      onChange={(e) => setQuestionField(i, "response_time_limit", e.target.value)}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">s</InputAdornment>,
                      }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!q.is_required}
                          onChange={(e) => setQuestionField(i, "is_required", e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      sx={(theme) => ({ '& .MuiFormControlLabel-label': { color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' } })}
                      label={
                        <Box sx={(theme) => ({ display: 'flex', alignItems: 'center', gap: 0.5, color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })}>
                          <RequiredIcon fontSize="small" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })} />
                          Obligatoire
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </QuestionCard>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addQuestion}
              variant="outlined"
              sx={(theme) => ({
                borderRadius: '12px',
                mt: 2,
                color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                borderColor: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                '&:hover': {
                  borderColor: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
                }
              })}
              disabled={questions.length >= maxQuestions}
            >
              Ajouter une question {maxQuestions && `(${questions.length}/${maxQuestions})`}
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
              <Button onClick={handlePrevious} sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })}>
                Retour: Configuration
              </Button>
              <Button variant="contained" onClick={handleNext}>
                Suivant: Invitations
              </Button>
            </Box>
          </GlassPaper>
        </Fade>
      )}

      {/* Review Section */}
      {currentStep === 2 && (
        <Fade in={true} timeout={500}>
          <GlassPaper elevation={0}>
            <Typography variant="h5" gutterBottom sx={(theme) => ({ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main' })}>
              <DescriptionIcon /> Récapitulatif
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" gutterBottom sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })}>Configuration</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'textSecondary' })}>Titre</Typography>
                      <Typography variant="body1">{title || "Non spécifié"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'textSecondary' })}>Temps préparation</Typography>
                      <Typography variant="body1">{preparationTime} secondes</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'textSecondary' })}>Temps réponse</Typography>
                      <Typography variant="body1">{responseTimeLimit} secondes</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'textSecondary' })}>Nouvelles tentatives</Typography>
                      <Typography variant="body1">{allowRetry ? "Autorisées" : "Non autorisées"}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: '12px' }}>
                  <Typography variant="h6" gutterBottom>Questions ({questions.length})</Typography>
                  {questions.map((q, i) => (
                    <Box key={i} sx={{ mb: 2, p: 2, background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                      <Typography variant="subtitle2">Question {i + 1}</Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>{q.text}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Chip label={`Préparation: ${q.preparation_time}s`} size="small" variant="outlined" />
                        <Chip label={`Réponse: ${q.response_time_limit}s`} size="small" variant="outlined" />
                        <Chip 
                          label={q.is_required ? "Obligatoire" : "Optionnelle"} 
                          size="small" 
                          color={q.is_required ? "primary" : "default"}
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 4 }}>
              <Button onClick={handlePrevious} sx={(theme) => ({ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' })}>
                Retour: Questions
              </Button>
              <GradientButton type="submit" disabled={submitting}>
                {submitting ? "Création en cours..." : "Créer la campagne"}
              </GradientButton>
            </Box>
          </GlassPaper>
        </Fade>
      )}
    </Box>
  );
}