# API Endpoints Documentation - Candidate Self-Service

## Overview
Two new endpoints have been added to allow authenticated candidates to view their own interview sessions, videos, and evaluations.

## Endpoints

### 1. List Candidate Interviews
- **URL**: `GET /api/candidate/interviews/`
- **Authentication**: Required (JWT token)
- **Authorization**: Candidate role only
- **Description**: Returns a list of all interview sessions for the authenticated candidate
- **Response**:
```json
{
  "interviews": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "campaign_title": "Campaign Title",
      "status": "invited|started|in_progress|completed|expired|cancelled",
      "invited_at": "2023-01-01T12:00:00Z",
      "started_at": "2023-01-01T12:30:00Z",
      "completed_at": "2023-01-01T13:00:00Z",
      "questions_count": 5
    }
  ]
}
```

### 2. Get Interview Detail
- **URL**: `GET /api/candidate/interviews/{session_id}/`
- **Authentication**: Required (JWT token)
- **Authorization**: Candidate role only, must own the session
- **Description**: Returns detailed information about a specific interview session
- **Response**:
```json
{
  "id": "uuid",
  "status": "completed",
  "invited_at": "2023-01-01T12:00:00Z",
  "started_at": "2023-01-01T12:30:00Z",
  "completed_at": "2023-01-01T13:00:00Z",
  "campaign": {
    "id": "uuid",
    "title": "Campaign Title",
    "description": "Campaign description",
    "start_date": "2023-01-01T00:00:00Z",
    "end_date": "2023-01-31T23:59:59Z"
  },
  "questions": [
    {
      "id": 1,
      "order": 1,
      "text": "Question text",
      "preparation_time": 30,
      "response_time_limit": 120
    }
  ],
  "responses": [
    {
      "id": "uuid",
      "question_id": 1,
      "question_order": 1,
      "video_url": "https://example.com/video.mp4",
      "duration": 90,
      "recorded_at": "2023-01-01T12:35:00Z",
      "evaluations": [
        {
          "id": 1,
          "overall_score": 4.5,
          "technical_skill": 4,
          "communication": 5,
          "motivation": 4,
          "cultural_fit": 5,
          "notes": "Excellent response",
          "evaluated_at": "2023-01-02T09:00:00Z"
        }
      ]
    }
  ]
}
```

## Security
- Both endpoints require authentication via JWT token
- Only users with candidate role can access these endpoints
- Users can only see their own interview sessions
- Video URLs are served with absolute paths when available

## Error Responses
- **403 Forbidden**: User is not a candidate or trying to access another candidate's data
- **404 Not Found**: Session not found or doesn't belong to the candidate
- **401 Unauthorized**: Missing or invalid JWT token

## Frontend Integration
- Use `candidateApi.listInterviews()` for the dashboard list
- Use `candidateApi.getInterview(sessionId)` for detailed view
- Components: `CandidateDashboard.jsx` and `CandidateInterviewDetail.jsx`
- Routes: `/candidate/dashboard` and `/candidate/interviews/:id`
