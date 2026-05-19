# Skill Intelligence System

A full-stack application for intelligent resume analysis and candidate-job matching using AI-powered skill extraction.

## 🎯 Features

- **Resume Upload & Processing**: Upload and parse resumes in multiple formats (PDF, TXT)
- **AI-Powered Skill Extraction**: Automatically extract technical skills, soft skills, experience levels, and proficiency using Azure OpenAI/GPT-4
- **Candidate Management**: Store and manage candidate profiles with structured skill data
- **Smart Matching**: Recommend candidates based on job requirements and skill alignment
- **Candidate Comparison**: Side-by-side comparison of multiple candidates
- **Search & Filter**: Advanced filtering by skills, experience, and proficiency levels
- **Analytics Dashboard**: Visualize candidate skill distributions and match metrics
- **Bulk Operations**: Export candidate data and manage multiple profiles efficiently

## 🏗️ Architecture

### Backend
- **Framework**: FastAPI
- **AI Integration**: Azure OpenAI API (GPT-4)
- **PDF Processing**: PyPDF2
- **API Features**: RESTful endpoints, CORS support, file upload handling

### Frontend
- **Framework**: React 19
- **Visualization**: Recharts for analytics and charts
- **HTTP Client**: Axios
- **UI Components**: Custom React components with CSS styling

### Data Storage
- JSON-based file storage
- Processed candidate profiles in `/data/processed/`
- Original resumes in `/data/resumes/`

## 📁 Project Structure

```
skill-intelligence-system/
├── backend/
│   ├── main.py                 # FastAPI application entry point
│   ├── skill_extractor.py      # AI-powered skill extraction
│   ├── pdf_processor.py        # PDF parsing and text extraction
│   ├── recommender.py          # Job-candidate matching engine
│   ├── requirements.txt        # Python dependencies
│   └── candidates.json         # Candidate database
│
├── frontend/
│   └── client/
│       ├── src/
│       │   ├── App.js          # Main application component
│       │   ├── components/     # React components
│       │   │   ├── AnalyticsDashboard.js
│       │   │   ├── ComparisonView.js
│       │   │   ├── SearchFilter.js
│       │   │   └── ExplanationModal.js
│       │   └── services/
│       │       └── api.js      # API client
│       ├── package.json
│       └── public/
│
└── data/
    ├── resumes/                # Original resume files
    └── processed/              # Extracted candidate profiles
```

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 16+
- Azure OpenAI API credentials

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Configure environment variables (.env):
```
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_API_VERSION=your_api_version
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
```

3. Run the FastAPI server:
```bash
cd backend
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend/client
npm install
```

2. Start development server:
```bash
npm start
# Application runs on http://localhost:3000
```

## 📋 Key Components

### Skill Extractor
Parses resume text and uses GPT-4 to extract:
- Contact information (email, phone, LinkedIn)
- Technical & soft skills
- Experience levels per skill
- Domain expertise
- Proficiency ratings (Beginner/Intermediate/Advanced/Expert)

### Recommendation Engine
Matches candidates to jobs based on:
- Required skill coverage
- Preferred skill matching
- Experience requirements
- Overall compatibility scoring

### Frontend Views
- **Upload Tab**: Resume upload and processing
- **Search Tab**: Filter and browse candidate database
- **Recommendations Tab**: View AI-generated job-candidate matches
- **Comparison Tab**: Compare multiple candidates side-by-side
- **Analytics Dashboard**: Visualize skill trends and metrics

## 🔧 API Endpoints

Key FastAPI endpoints:
- `POST /upload` - Upload and process resume
- `GET /candidates` - Retrieve all candidates
- `POST /recommend` - Get candidate recommendations
- `GET /search` - Search candidates by skills
- `PUT /candidates/{candidate_id}` - Update candidate profile
- `DELETE /candidates` - Bulk delete candidates

## 📦 Dependencies

### Backend
- fastapi >= 0.104.0
- uvicorn >= 0.24.0
- openai >= 1.0.0
- PyPDF2 >= 3.0.0
- pydantic >= 2.0.0
- python-dotenv >= 1.0.0

### Frontend
- react >= 19.2.3
- axios >= 1.13.2
- recharts >= 3.5.1

## 📝 Usage Example

1. Upload a resume via the UI
2. System automatically extracts skills and creates a candidate profile
3. Define job requirements with required/preferred skills
4. View AI-generated recommendations with match scores
5. Compare top candidates and make hiring decisions



---

**Built with FastAPI + React + Azure OpenAI GPT-4**
