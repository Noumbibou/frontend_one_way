import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner } from 'react-bootstrap';
import { FaPlay, FaStop, FaExclamationTriangle } from 'react-icons/fa';
import api, { interviewApi } from '../../services/api';
import './CandidateLanding.css';

const STAGES = {
  LOADING: 'loading',
  INSTRUCTIONS: 'instructions',
  PREPARATION: 'preparation',
  RECORDING: 'recording',
  REVIEW: 'review',
  COMPLETED: 'completed',
  ERROR: 'error'
};

const LoadingSpinner = ({ message = "Chargement en cours..." }) => (
  <div className="text-center p-5">
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Chargement...</span>
    </Spinner>
    <p className="mt-3">{message}</p>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="alert alert-danger mt-5">
    <div className="d-flex align-items-center">
      <FaExclamationTriangle className="me-2" size={24}/>
      <div>
        <h5 className="alert-heading">Erreur</h5>
        <p className="mb-0">{error}</p>
        {onRetry && (
          <Button variant="outline-danger" className="mt-3" onClick={onRetry}>
            Réessayer
          </Button>
        )}
      </div>
    </div>
  </div>
);

export default function CandidateLanding() {
  const { accessToken } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGES.LOADING);
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [recordedBlobs, setRecordedBlobs] = useState(() => {
    // Initialiser avec un tableau de la bonne taille rempli de null
    if (session?.questions) {
      return new Array(session.questions.length).fill(null);
    }
    return [];
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const preparationTimeRef = useRef(0);
  const recordingTimeRef = useRef(0);
  const isStoppingRef = useRef(false);
  const isSubmittingAnswerRef = useRef(false);

  const handleError = useCallback((err, context = "") => {
    console.error(`Error ${context}:`, err);
    let errorMessage = "Une erreur est survenue";
    
    if (err.response?.data?.code) {
      const code = err.response.data.code;
      const messages = {
        link_expired: "Le lien d'accès a expiré.",
        link_used: "Ce lien a déjà été utilisé.",
        session_used: "Cette session a déjà été utilisée.",
        session_terminated: "Session terminée ou annulée.",
        session_already_started: "La session a déjà été démarrée.",
        session_already_used: "Cette session a déjà été utilisée.",
        session_not_found: "Session introuvable.",
        data_preparation_error: "Erreur lors du chargement des questions."
      };
      errorMessage = messages[code] || err.response.data.error || errorMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }

    setError(errorMessage);
    setStage(STAGES.ERROR);
  }, []);

  const startMediaStream = useCallback(async () => {
    try {
      setMediaError(null);
      stopMediaTracks();
      
      const constraints = {
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => {
          console.error("Erreur de lecture vidéo:", err);
          setMediaError("Impossible de démarrer la caméra. Veuillez vérifier les permissions.");
        });
      }
      
      return true;
    } catch (err) {
      console.error("Erreur d'accès aux médias:", err);
      setMediaError("L'accès à la caméra et/ou au micro est nécessaire pour continuer.");
      return false;
    }
  }, []);

  const checkMediaPermissions = useCallback(async () => {
    return await startMediaStream();
  }, [startMediaStream]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setStage(STAGES.LOADING);
        const hasPermission = await checkMediaPermissions();
        if (!hasPermission) return;

        const response = await api.get(`session-access/${accessToken}/`);
        
        if (response.data.success === false) {
          // Si le serveur renvoie une erreur
          throw new Error(response.data.error || "Échec du chargement de la session");
        }
        
        // Mettre à jour l'état de la session avec les données reçues
        setSession(prev => ({
          ...prev,
          ...response.data,
          id: response.data.session_id || prev.id,
          status: response.data.status || prev.status,
          is_used: response.data.is_used || false
        }));
        
        // Vérifier si la session est déjà démarrée
        if (response.data.status === "in_progress" || response.data.is_used) {
          setError("Cette session a déjà été démarrée. Veuillez utiliser le même onglet/navigateur.");
          setStage(STAGES.ERROR);
        } else {
          setStage(STAGES.INSTRUCTIONS);
        }

      } catch (err) {
        handleError(err, "chargement de la session");
      }
    };

    loadSession();

    return () => {
      stopMediaTracks();
      clearTimers();
    };
  }, [accessToken, checkMediaPermissions, handleError]);

  const clearTimers = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const stopMediaTracks = () => { 
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCountdown = (duration, onComplete) => {
    clearTimers();
    let remaining = duration;
    setTimeLeft(remaining);

    timerRef.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearTimers();
        onComplete();
      }
    }, 1000);
  };

  const startInterview = async () => {
    if (isStarting) return;
    
    try {
      setIsStarting(true);
      
      // Appel pour démarrer la session d'entretien
      const response = await api.post(`session-access/${accessToken}/`, { action: 'start_session' });
      
      if (response.data.success) {
        // Mettre à jour l'état local avec les données de la réponse
        setSession(prev => ({
          ...prev,
          id: response.data.session_id,
          status: response.data.status || "in_progress",
          is_used: true,
          started_at: response.data.started_at || new Date().toISOString()
        }));

        // Démarrer la préparation
        // Démarrer la préparation pour la question courante
        startPreparation(currentQuestionIndex);
      } else {
        throw new Error(response.data.error || "Échec du démarrage de la session");
      }
      
    } catch (error) {
      handleError(error, "démarrage de l'entretien");
    } finally {
      setIsStarting(false);
    }
  };

  const startPreparation = (index = currentQuestionIndex) => {
    const question = session.questions[index];
    setStage(STAGES.PREPARATION);
    preparationTimeRef.current = Date.now();
    startCountdown(question.preparation_time, () => startRecording(index));
  };

  const stopRecording = useCallback(() => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    // arrêter le timer d'abord pour éviter un double-stop
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      isStoppingRef.current = false; // rien à stopper
    }
  }, []);

  const startRecording = useCallback(async (index = currentQuestionIndex) => {
    try {
      const question = session.questions[index];
      const prepStart = preparationTimeRef.current || Date.now();
      const prepUsedMs = Math.max(0, Date.now() - prepStart);
      preparationTimeRef.current = prepUsedMs;
      
      // Arrêter l'aperçu et démarrer l'enregistrement
      stopMediaTracks();
      
      // Démarrer le flux média avec les bonnes contraintes
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }, 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;

      // Configurer l'élément vidéo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Désactiver le son pour éviter les échos
        videoRef.current.setAttribute('playsinline', ''); // Pour iOS
        
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("Erreur lors de la lecture de la vidéo:", err);
          // Essayer de récupérer en cas d'échec
          videoRef.current.muted = true;
          await videoRef.current.play().catch(console.error);
        }
      }

      // S'assurer que le flux est actif
      if (!streamRef.current || streamRef.current.getVideoTracks().length === 0) {
        throw new Error("Aucune piste vidéo disponible pour l'enregistrement");
      }

      const mimeType = 'video/webm;codecs=vp9,opus';
      const options = { mimeType };
      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      const recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('Erreur MediaRecorder:', event);
        setError("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
        setStage(STAGES.ERROR);
      };

      mediaRecorder.onstop = async () => {
        try {
          if (isSubmittingAnswerRef.current) return;
          isSubmittingAnswerRef.current = true;
          if (recordedChunks.length === 0) {
            console.warn('Aucune donnée enregistrée');
            setError("Aucune donnée n'a été enregistrée. Veuillez réessayer.");
            setStage(STAGES.ERROR);
            isSubmittingAnswerRef.current = false;
            isStoppingRef.current = false;
            return;
          }

          // Construire le fichier à partir des chunks
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const file = new File([blob], `response_${Date.now()}.webm`, { type: 'video/webm' });

          const q = session.questions[index];
          const prepMs = typeof preparationTimeRef.current === 'number' ? preparationTimeRef.current : 0;
          const recMs = recordingTimeRef.current ? (Date.now() - recordingTimeRef.current) : 0;

          // Construire le FormData pour l'API backend par question
          const formData = new FormData();
          formData.append('question', q.id);
          formData.append('video_file', file);
          formData.append('duration', Math.max(1, Math.round(recMs / 1000))); // en secondes
          formData.append('preparation_time_used', Math.max(0, Math.round(prepMs / 1000)));
          formData.append('response_time_used', Math.max(1, Math.round(recMs / 1000)));

          // Envoyer la réponse de la question immédiatement
          await api.post(`session-access/${accessToken}/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
          });

          // Nettoyer la vidéo d'aperçu
          if (videoRef.current) {
            try { videoRef.current.pause(); } catch (e) {}
            videoRef.current.srcObject = null;
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }

          // Passer à la question suivante ou terminer
          const total = session.questions.length;
          const nextIndex = index + 1;
          if (nextIndex < total) {
            setCurrentQuestionIndex(nextIndex);
            // lancer la préparation explicitement pour l'index suivant
            startPreparation(nextIndex);
          } else {
            setStage(STAGES.COMPLETED);
          }
        } catch (err) {
          console.error('Erreur lors de la soumission de la réponse:', err);
          setError("Erreur lors de la soumission de la réponse. Veuillez réessayer.");
          setStage(STAGES.ERROR);
        } finally {
          isSubmittingAnswerRef.current = false;
          isStoppingRef.current = false;
        }
      };

      // Démarrer l'enregistrement avec un intervalle de 100ms
      mediaRecorder.start(100);
      setIsRecording(true);
      recordingTimeRef.current = Date.now();
      setStage(STAGES.RECORDING);

      // Démarrer le compte à rebours d'enregistrement
      startCountdown(question.response_time_limit, stopRecording);
    
    } catch (err) {
      console.error('Erreur dans startRecording:', err);
      setError(err.message || "Erreur lors du démarrage de l'enregistrement");
      setStage(STAGES.ERROR);
    }
  }, [session, stopRecording, startCountdown, stopMediaTracks, currentQuestionIndex]);

  // Helper d'affichage mm:ss
  const formatTime = (sec) => {
    const s = Math.max(0, Number(sec) || 0);
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, '0');
    const r = (s % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${r}`;
  };

  const currentQuestion = useMemo(
    () => session?.questions?.[currentQuestionIndex],
    [session, currentQuestionIndex]
  );
  const progress = useMemo(
    () => (session ? Math.round((currentQuestionIndex / session.questions.length) * 100) : 0),
    [session, currentQuestionIndex]
  );

  if (stage === STAGES.LOADING) return <LoadingSpinner message="Chargement de votre session d'entretien..." />;
  if (stage === STAGES.ERROR) return <ErrorDisplay error={error} onRetry={() => setStage(STAGES.INSTRUCTIONS)} />;

  return (
    <div className="container mt-5">
      <h2>{session.campaign.title}</h2>
      <p>{session.campaign.description}</p>

      <div className="mb-3">
        <ProgressBar now={progress} />
      </div>

      {stage === STAGES.INSTRUCTIONS && (
        <Card className="p-4 mb-3">
          <h5>Instructions :</h5>
          <ul>
            <li>Préparez-vous à répondre aux questions.</li>
            <li>Vous aurez un temps de préparation et un temps d’enregistrement pour chaque question.</li>
            <li>Assurez-vous que votre caméra et micro fonctionnent.</li>
          </ul>
          <Button 
            variant="primary" 
            onClick={startInterview} 
            disabled={isStarting}
          >
            {isStarting ? (
              <>
                <Spinner as="span" size="sm" animation="border" role="status" aria-hidden="true" className="me-2" />
                Démarrage...
              </>
            ) : (
              <><FaPlay className="me-2"/> Commencer l'entretien</>
            )}
          </Button>
        </Card>
      )}

      {(stage === STAGES.PREPARATION || stage === STAGES.RECORDING) && currentQuestion && (
        <Card className="p-4 mb-3 text-center">
          <h5>Question {currentQuestionIndex + 1}/{session.questions.length}: {currentQuestion.text}</h5>
          <p className="text-muted">Enregistrement en cours...</p>
          <p className="h4 mb-3">
            {isRecording && <span className="recording-indicator"></span>}
            {formatTime(timeLeft)}
          </p>
          
          <video 
            ref={videoRef} 
            className="candidate-video mb-3" 
            autoPlay 
            playsInline 
            muted 
          />
          
          <div className="d-flex justify-content-center gap-3">
            <Button 
              variant="danger" 
              onClick={stopRecording}
              disabled={!isRecording}
              className="px-4"
            >
              <FaStop className="me-2" />
              Arrêter et Enregistrer
            </Button>
          </div>
        </Card>
      )}

      {/* Étape de révision supprimée: les réponses sont envoyées automatiquement et on avance directement */}

      {stage === STAGES.COMPLETED && (
        <Card className="p-4 mb-3 text-center">
          <h5>Entretien terminé</h5>
          <p>Toutes vos réponses ont été enregistrées automatiquement. Merci pour votre participation.</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

// --- Barre de progression ---
const ProgressBar = ({ now }) => (
  <div className="progress" style={{ height: '8px' }}>
    <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${now}%` }} role="progressbar" aria-valuenow={now} aria-valuemin="0" aria-valuemax="100"></div>
  </div>
);
