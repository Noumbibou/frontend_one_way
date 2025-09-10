import React, { useState } from "react";
import "./CampaignForm.css";

export default function CampaignForm({ initial = {}, onSubmit, submitting }) {
  const [title, setTitle] = useState(initial.title || "");
  const [description, setDescription] = useState(initial.description || "");
  const [preparationTime, setPreparationTime] = useState(initial.preparation_time ?? 30);
  const [responseTimeLimit, setResponseTimeLimit] = useState(initial.response_time_limit ?? 120);
  const [maxQuestions, setMaxQuestions] = useState(initial.max_questions ?? 5);
  const [allowRetry, setAllowRetry] = useState(initial.allow_retry ?? false);
  const [startDate, setStartDate] = useState(initial.start_date || "");
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

  const addQuestion = () =>
    setQuestions([
      ...questions,
      { text: "", order: questions.length + 1, preparation_time: 30, response_time_limit: 120, is_required: true },
    ]);
  const removeQuestion = (i) => {
    const copy = questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, order: idx + 1 }));
    setQuestions(copy);
  };
  const setQuestionField = (i, key, value) => {
    const copy = [...questions];
    copy[i] = { ...copy[i], [key]: value };
    setQuestions(copy);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // build payload matching CreateCampaignSerializer
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

  return (
    <form className="campaign-form" onSubmit={handleSubmit}>
      <div className="row">
        <label>Intitulé</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>

      <div className="row">
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </div>

      <div className="form-grid">
        <div className="row">
          <label>Temps de préparation par question (s)</label>
          <input type="number" min={0} value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} />
        </div>
        <div className="row">
          <label>Limite réponse par question (s)</label>
          <input type="number" min={0} value={responseTimeLimit} onChange={(e) => setResponseTimeLimit(e.target.value)} />
        </div>
      </div>

      <div className="form-grid">
        <div className="row">
          <label>Nombre max de questions</label>
          <input type="number" min={1} value={maxQuestions} onChange={(e) => setMaxQuestions(e.target.value)} />
        </div>
        <div className="row">
          <label>Autoriser retry</label>
          <div className="switch">
            <input id="allowRetry" type="checkbox" checked={allowRetry} onChange={(e) => setAllowRetry(e.target.checked)} />
            <label htmlFor="allowRetry">{allowRetry ? "Oui" : "Non"}</label>
          </div>
        </div>
      </div>

      <div className="form-grid">
        <div className="row">
          <label>Date de début</label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="row">
          <label>Date de fin</label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="questions">
        <div className="q-head">
          <label>Questions</label>
          <button type="button" className="btn-add" onClick={addQuestion}>
            Ajouter
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="question">
            <div className="question-top">
              <textarea
                value={q.text}
                onChange={(e) => setQuestionField(i, "text", e.target.value)}
                placeholder={`Question ${i + 1}`}
                rows={2}
              />
            </div>

            <div className="q-meta">
              <label>Préparation (s)</label>
              <input
                type="number"
                min={0}
                value={q.preparation_time}
                onChange={(e) => setQuestionField(i, "preparation_time", e.target.value)}
              />

              <label>Limite (s)</label>
              <input
                type="number"
                min={0}
                value={q.response_time_limit}
                onChange={(e) => setQuestionField(i, "response_time_limit", e.target.value)}
              />

              <label>Obligatoire</label>
              <input type="checkbox" checked={!!q.is_required} onChange={(e) => setQuestionField(i, "is_required", e.target.checked)} />

              <button type="button" className="btn-remove" onClick={() => removeQuestion(i)}>
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Création..." : "Créer la campagne"}
        </button>
      </div>
    </form>
  );
}