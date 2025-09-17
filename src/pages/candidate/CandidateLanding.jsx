import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, Spinner } from 'react-bootstrap';
import { FaPlay, FaStop, FaExclamationTriangle, FaCheckCircle, FaVideo, FaMicrophone, FaMoon, FaSun } from 'react-icons/fa';
import api, { interviewApi } from '../../services/api';
import * as faceapi from 'face-api.js';
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
  <div className="candidate-loading-container">
    <div className="candidate-loading-spinner">
      <Spinner animation="border" role="status" variant="primary" />
      <p className="candidate-loading-message">{message}</p>
    </div>
  </div>
);

const ErrorDisplay = ({ error, onRetry }) => (
  <div className="candidate-error-container">
    <div className="candidate-error-content">
      <div className="candidate-error-icon">
        <FaExclamationTriangle />
      </div>
      <h3>Erreur</h3>
      <p>{error}</p>
      {onRetry && (
        <Button variant="primary" className="candidate-retry-btn" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  </div>
);

export default function CandidateLanding() {
  const { accessToken } = useParams();
  const navigate = useNavigate();

  const [stage, setStage] = useState(STAGES.LOADING);
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
    } catch (_) {}
    // Fallback to current DOM class
    return document.documentElement.classList.contains('dark');
  });
  const [session, setSession] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const [networkQuality, setNetworkQuality] = useState(null);
  const [networkDetails, setNetworkDetails] = useState(null);
  // Multi-face detection state
  const [faceApiReady, setFaceApiReady] = useState(false);
  const [modelType, setModelType] = useState(null); // 'ssd' | 'tiny'
  const [multiFaceWarning, setMultiFaceWarning] = useState(false);
  const faceCheckTimerRef = useRef(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  // Stabilization refs for detection
  const consecutiveMultiRef = useRef(0);
  const consecutiveSingleRef = useRef(0);
  const lastDetectionsRef = useRef([]);
  const SHOW_FACE_DEBUG = false; // hide debug boxes by default for cleaner UI
  
  // Load model(s) from /models: try ssdMobilenetv1 first, then fallback to tinyFaceDetector
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        if (mounted) {
          setModelType('ssd');
          setFaceApiReady(true);
          console.log('[FaceDetect] Modèle actif: ssdMobilenetv1 (local)');
          return;
        }
      } catch (e) {
        console.warn('[FaceDetect] ssdMobilenetv1 non disponible en local, tentative tinyFaceDetector…');
      }
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        if (mounted) {
          setModelType('tiny');
          setFaceApiReady(true);
          console.log('[FaceDetect] Modèle actif: tinyFaceDetector (local)');
          return;
        }
      } catch (e) {
        console.warn('[FaceDetect] tinyFaceDetector non disponible en local');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Run detection every 300ms during preparation/recording
  useEffect(() => {
    const shouldRun = (stage === STAGES.PREPARATION || stage === STAGES.RECORDING);
    const video = videoRef.current;
    const detect = async () => {
      if (!shouldRun || !faceApiReady || !video) return;
      if (!video.videoWidth || !video.videoHeight || video.readyState < 2) return;
      try {
        let detections = [];
        if (modelType === 'ssd') {
          detections = await faceapi.detectAllFaces(
            video,
            new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
          );
        } else if (modelType === 'tiny') {
          detections = await faceapi.detectAllFaces(
            video,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.2 })
          );
        }
        // Filter out extremely small boxes (noise) based on area threshold (>= 2% of frame)
        const vw = video.videoWidth || 1;
        const vh = video.videoHeight || 1;
        const minArea = vw * vh * 0.005;
        lastDetectionsRef.current = detections || [];
        const valid = lastDetectionsRef.current.filter(d => {
          const b = d.box || d;
          const w = b.width || 0; const h = b.height || 0;
          return (w * h) >= minArea;
        });
        const count = valid.length;
        console.log('Nombre de visages:', count);
        // Hysteresis: require N consecutive frames to switch states
        const upThreshold = 3;   // ~900ms at 300ms interval
        const downThreshold = 5; // ~1.5s to clear
        if (count > 1) {
          consecutiveMultiRef.current += 1;
          consecutiveSingleRef.current = 0;
          if (consecutiveMultiRef.current >= upThreshold && !multiFaceWarning) {
            setMultiFaceWarning(true);
          }
        } else {
          consecutiveSingleRef.current += 1;
          consecutiveMultiRef.current = 0;
          if (consecutiveSingleRef.current >= downThreshold && multiFaceWarning) {
            setMultiFaceWarning(false);
          }
        }

        // Draw debug overlay (optional)
        if (SHOW_FACE_DEBUG) {
          const canvas = canvasRef.current;
          if (canvas) {
            const cw = video.clientWidth || video.videoWidth;
            const ch = video.clientHeight || video.videoHeight;
            // Ensure canvas matches displayed size
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, cw, ch);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.85)';
            ctx.lineWidth = 3;
            ctx.fillStyle = 'rgba(255,0,0,0.35)';
            ctx.font = '12px sans-serif';
            // Scale from video intrinsic dims to displayed dims
            const sx = cw / (video.videoWidth || cw);
            const sy = ch / (video.videoHeight || ch);
            (lastDetectionsRef.current || []).forEach(d => {
              const b = d.box || d;
              const x = (b.x || b.left || 0) * sx;
              const y = (b.y || b.top || 0) * sy;
              const w = (b.width || 0) * sx;
              const h = (b.height || 0) * sy;
              ctx.strokeRect(x, y, w, h);
              ctx.fillRect(x, y - 16, Math.max(60, 40), 16);
              const score = typeof d.score === 'number' ? d.score.toFixed(2) : '';
              ctx.fillStyle = '#fff';
              ctx.fillText(`face ${score}`, x + 4, y - 4);
              ctx.fillStyle = 'rgba(255,0,0,0.35)';
            });
          }
        }
      } catch (err) {
        // ignore transient errors
      }
    };
    if (shouldRun) {
      faceCheckTimerRef.current = window.setInterval(detect, 300);
      detect();
    }
    return () => {
      if (faceCheckTimerRef.current) {
        clearInterval(faceCheckTimerRef.current);
        faceCheckTimerRef.current = null;
      }
    };
  }, [stage, faceApiReady, modelType]);
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

  // Apply theme to document
  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch (_) {}
  }, [isDark]);

  const toggleTheme = () => setIsDark((v) => !v);

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

  const checkNetworkQuality = useCallback(async () => {
    try {
      const navConn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      let details = {};
      if (navConn) {
        details = {
          effectiveType: navConn.effectiveType,
          downlink: navConn.downlink,
          rtt: navConn.rtt,
          saveData: navConn.saveData
        };
      }

      // Fallback RTT test if Network Information API unavailable or inconclusive
      const measureRTT = async () => {
        const attempts = 3;
        let sum = 0;
        for (let i = 0; i < attempts; i++) {
          const t0 = performance.now();
          try {
            // Use the public session-access GET endpoint for a lightweight call
            await fetch(`${api.defaults.baseURL}session-access/${accessToken}/`, { cache: 'no-store', method: 'GET' });
            const t1 = performance.now();
            sum += (t1 - t0);
          } catch (_) {
            sum += 1000; // penalize on failure
          }
        }
        return sum / attempts;
      };

      let quality = 'moderate';
      let rtt = details.rtt;
      if (!rtt || typeof rtt !== 'number') {
        rtt = await measureRTT();
      }
      // Determine quality primarily from RTT and secondarily from downlink
      if (rtt <= 150) quality = 'good';
      else if (rtt <= 400) quality = 'moderate';
      else quality = 'poor';

      const dl = Number(details.downlink || 0);
      if (dl && dl < 1) quality = 'poor';

      setNetworkDetails({ ...details, measuredRtt: Math.round(rtt) });
      setNetworkQuality(quality);
      return quality;
    } catch (e) {
      setNetworkDetails(null);
      setNetworkQuality('moderate');
      return 'moderate';
    }
  }, [accessToken]);

  useEffect(() => {
    const loadSession = async () => {
      try {
        setStage(STAGES.LOADING);
        const hasPermission = await checkMediaPermissions();
        if (!hasPermission) return;
        await checkNetworkQuality();

        const response = await api.get(`session-access/${accessToken}/`);
        
        if (response.data.success === false) {
          throw new Error(response.data.error || "Échec du chargement de la session");
        }
        
        setSession(prev => ({
          ...prev,
          ...response.data,
          id: response.data.session_id || prev.id,
          status: response.data.status || prev.status,
          is_used: response.data.is_used || false
        }));
        
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
  }, [accessToken, checkMediaPermissions, checkNetworkQuality, handleError]);

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
      // Use backend /start/ endpoint (or interviewApi abstraction)
      const response = await interviewApi.startSession(accessToken);
      if (response && (response.success || response.status === 'in_progress')) {
        setSession(prev => ({
          ...prev,
          id: response.session_id || response.id || prev?.id,
          status: response.status || "in_progress",
          is_used: true,
          started_at: response.started_at || new Date().toISOString()
        }));

        startPreparation(currentQuestionIndex);
      } else {
        const msg = response?.error || response?.detail || "Échec du démarrage de la session";
        throw new Error(msg);
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
    clearTimers();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      isStoppingRef.current = false;
    }
  }, []);

  const startRecording = useCallback(async (index = currentQuestionIndex) => {
    try {
      const question = session.questions[index];
      const prepStart = preparationTimeRef.current || Date.now();
      const prepUsedMs = Math.max(0, Date.now() - prepStart);
      preparationTimeRef.current = prepUsedMs;
      
      stopMediaTracks();
      
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', '');
        
        try {
          await videoRef.current.play();
        } catch (err) {
          console.warn("Erreur lors de la lecture de la vidéo:", err);
          videoRef.current.muted = true;
          await videoRef.current.play().catch(console.error);
        }
      }

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

          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const file = new File([blob], `response_${Date.now()}.webm`, { type: 'video/webm' });

          const q = session.questions[index];
          const prepMs = typeof preparationTimeRef.current === 'number' ? preparationTimeRef.current : 0;
          const recMs = recordingTimeRef.current ? (Date.now() - recordingTimeRef.current) : 0;

          const formData = new FormData();
          // Backend expects a list field 'responses' with JSON per response
          formData.append('responses', JSON.stringify({
            question_id: q.id,
            preparation_time: Math.max(0, Math.round(prepMs)),
            recording_time: Math.max(1, Math.round(recMs)),
          }));
          // And each file under key `video_{question_id}`
          formData.append(`video_${q.id}`, file);

          // Submit to session submit endpoint using session.id
          await api.post(`sessions/${session.id}/submit/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 300000,
          });

          if (videoRef.current) {
            try { videoRef.current.pause(); } catch (e) {}
            videoRef.current.srcObject = null;
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }

          const total = session.questions.length;
          const nextIndex = index + 1;
          if (nextIndex < total) {
            setCurrentQuestionIndex(nextIndex);
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

      mediaRecorder.start(100);
      setIsRecording(true);
      recordingTimeRef.current = Date.now();
      setStage(STAGES.RECORDING);

      startCountdown(question.response_time_limit, stopRecording);
    
    } catch (err) {
      console.error('Erreur dans startRecording:', err);
      setError(err.message || "Erreur lors du démarrage de l'enregistrement");
      setStage(STAGES.ERROR);
    }
  }, [session, stopRecording, startCountdown, stopMediaTracks, currentQuestionIndex, accessToken]);

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
  const progress = useMemo(() => {
    if (!session || !Array.isArray(session.questions) || session.questions.length === 0) return 0;
    const total = session.questions.length;
    if (stage === STAGES.INSTRUCTIONS) return 0;
    if (stage === STAGES.COMPLETED) return 100;
    const completedCount = Math.min(total, currentQuestionIndex + 1);
    return Math.round((completedCount / total) * 100);
  }, [session, currentQuestionIndex, stage]);

  if (stage === STAGES.LOADING) return <LoadingSpinner message="Chargement de votre session d'entretien..." />;
  if (stage === STAGES.ERROR) return <ErrorDisplay error={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="candidate-container">
      <div className="candidate-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <h1 className="candidate-title">{session?.campaign?.title || "Entretien"}</h1>
          <p className="candidate-description">{session?.campaign?.description || ""}</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={toggleTheme}
          aria-label={isDark ? 'Basculer en mode clair' : 'Basculer en mode sombre'}
          title={isDark ? 'Mode clair' : 'Mode sombre'}
          style={{ whiteSpace: 'nowrap' }}
        >
          {isDark ? <><FaSun className="me-2"/> Mode clair</> : <><FaMoon className="me-2"/> Mode sombre</>}
        </button>
      </div>

      <div className="candidate-progress-container">
        <div className="candidate-progress-info">
          <span>Progression: {currentQuestionIndex + 1}/{session?.questions?.length || 0}</span>
          <span>{progress}%</span>
        </div>
        <div className="candidate-progress-bar">
          <div 
            className="candidate-progress-fill" 
            style={{ width: `${progress}%` }}
            role="progressbar" 
            aria-valuenow={progress} 
            aria-valuemin="0" 
            aria-valuemax="100"
          ></div>
        </div>
      </div>

      {stage === STAGES.INSTRUCTIONS && (
        <Card className="candidate-card candidate-instructions">
          <div className="candidate-card-header">
            <h3>Instructions pour l'entretien</h3>
          </div>
          <div className="candidate-card-body">
            <div className="instructions-list">
              <div className="instruction-item">
                <div className="instruction-icon">📋</div>
                <div className="instruction-content">
                  <h5>Préparez-vous à répondre aux questions</h5>
                  <p>Chaque question aura un temps de préparation défini.</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">⏱️</div>
                <div className="instruction-content">
                  <h5>Respectez les temps impartis</h5>
                  <p>Vous aurez un temps limité pour préparer et enregistrer chaque réponse.</p>
                </div>
              </div>
              <div className="instruction-item">
                <div className="instruction-icon">🎥</div>
                <div className="instruction-content">
                  <h5>Vérifiez votre équipement</h5>
                  <p>Assurez-vous que votre caméra et micro fonctionnent correctement.</p>
                </div>
              </div>
            </div>
            
            {networkQuality && (
              <div className={`network-status network-${networkQuality}`}>
                <div className="network-status-header">
                  <span className="network-icon">📶</span>
                  <span className="network-quality">
                    Qualité de connexion: {networkQuality === 'good' ? 'Bonne' : networkQuality === 'moderate' ? 'Moyenne' : 'Faible'}
                  </span>
                </div>
                {networkDetails && (
                  <div className="network-details">
                    <span>Type: {networkDetails.effectiveType || 'n/a'}</span>
                    <span>Débit: {networkDetails.downlink || 'n/a'} Mbps</span>
                    <span>Latence: {networkDetails.rtt || 'n/a'} ms</span>
                  </div>
                )}
                {networkQuality === 'poor' && (
                  <div className="network-tips">
                    <strong>Conseils:</strong> Rapprochez-vous de votre routeur, fermez les applications gourmandes en bande passante, ou utilisez un réseau filaire si possible.
                  </div>
                )}
              </div>
            )}
            
            <div className="media-check">
              <div className="media-check-item">
                <FaVideo className="media-icon" />
                <span>Caméra: {mediaError ? '❌' : '✅'}</span>
              </div>
              <div className="media-check-item">
                <FaMicrophone className="media-icon" />
                <span>Micro: {mediaError ? '❌' : '✅'}</span>
              </div>
            </div>
            
            <Button 
              variant="primary" 
              className="candidate-start-btn"
              onClick={startInterview} 
              disabled={isStarting || networkQuality === 'poor'}
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
          </div>
        </Card>
      )}

      {(stage === STAGES.PREPARATION || stage === STAGES.RECORDING) && currentQuestion && (
        <Card className="candidate-card candidate-question">
          <div className="candidate-card-header">
            <h3>Question {currentQuestionIndex + 1}/{session.questions.length}</h3>
            <div className={`time-display ${stage === STAGES.RECORDING ? 'recording' : 'preparing'}`}>
              <span className="time-label">{stage === STAGES.PREPARATION ? 'Préparation' : 'Enregistrement'}</span>
              <span className="time-remaining">{formatTime(timeLeft)}</span>
            </div>
          </div>
          
          <div className="candidate-card-body">
            <div className="question-text">
              <p>{currentQuestion.text}</p>
            </div>
            
            <div className="video-container">
              <video 
                ref={videoRef} 
                className="candidate-video" 
                autoPlay 
                playsInline 
                muted 
              />
              {SHOW_FACE_DEBUG && (
                <canvas ref={canvasRef} className="face-debug-canvas"/>
              )}
              {(stage === STAGES.RECORDING || stage === STAGES.PREPARATION) && (
                <>
                  <div className="recording-overlay">
                    <div className="timer-badge">
                      <span className="timer-dot"></span>
                      <span>
                        {stage === STAGES.RECORDING ? 'Enregistrement' : 'Préparation'} · {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                  {multiFaceWarning && (
                    <div className="multi-face-warning" role="status" aria-live="polite">
                      Nous avons détecté plusieurs visages dans le cadre. Veuillez vous assurer d'être seul face à la caméra.
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="action-buttons">
              {stage === STAGES.RECORDING && (
                <Button 
                  variant="danger" 
                  onClick={stopRecording}
                  className="stop-recording-btn"
                >
                  <FaStop className="me-2" />
                  Arrêter et Enregistrer
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {stage === STAGES.COMPLETED && (
        <Card className="candidate-card candidate-completed">
          <div className="candidate-card-body text-center">
            <div className="completed-icon">
              <FaCheckCircle />
            </div>
            <h3>Entretien terminé</h3>
            <p>Merci pour votre participation. Toutes vos réponses ont été enregistrées avec succès.</p>
            <Button variant="primary" onClick={() => navigate('/')}>Retour à l'accueil</Button>
          </div>
        </Card>
      )}
    </div>
  );
}