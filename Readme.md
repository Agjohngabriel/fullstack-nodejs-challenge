# Peptide Suggestions App

A full-stack web application that provides personalized peptide recommendations based on user health goals and age. The application features a React frontend with authentication, a Node.js/Express backend with comprehensive validation, and built-in analytics.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd peptide-suggestions-app
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   
   The backend server will start on `http://localhost:3001`

3. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   
   The frontend application will start on `http://localhost:3000`

## 📋 Project Structure

```
peptide-suggestions-app/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── middleware/      # Validation and auth middleware
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic services
│   │   ├── utils/          # Logging and utilities
│   │   └── server.js       # Main server file
│   ├── logs/               # Application and analytics logs
│   └── package.json
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React context providers
│   │   └── App.js         # Main App component
│   └── package.json
└── README.md
```

## 🔧 Core Features

### User Interface
- **Interactive Form**: Age input and health goal selection (energy, sleep, focus, recovery, longevity, weight management, immune support)
- **Authentication System**: Optional user registration and login
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Real-time Validation**: Client-side and server-side input validation

### Backend Services
- **Suggestions Engine**: Personalized peptide recommendations based on age and health goals
- **User Management**: Authentication with JWT tokens
- **Analytics Tracking**: Request logging and user behavior analytics
- **Rate Limiting**: Protection against API abuse
- **Comprehensive Logging**: Structured logging with Winston

### Data Validation
- **Input Sanitization**: Joi schema validation for all endpoints
- **Age Constraints**: Validates age between 18-120 years
- **Goal Validation**: Ensures valid health goal selection
- **Request Rate Limiting**: Protects against excessive API calls

## 🛡️ Edge Case Handling

The application includes robust handling for various edge cases:

### Age-Related Validations
- **Minimum Age**: Users under 18 are blocked with appropriate messaging
- **Young Adult Warnings**: Users under 21 receive additional medical supervision warnings
- **Senior Considerations**: Users over 70 get enhanced monitoring recommendations
- **Goal-Age Combinations**: Specific warnings for age-inappropriate goals (e.g., longevity peptides for users under 30)

### Input Validation Edge Cases
- **Non-numeric Age**: Converts strings to numbers, rejects invalid inputs
- **Out-of-Range Values**: Handles negative ages, excessively high ages
- **Invalid Goal Selection**: Validates against predefined health goals list
- **Empty/Missing Fields**: Comprehensive required field validation
- **SQL Injection Prevention**: All inputs are sanitized and validated

### Network and System Edge Cases
- **Rate Limiting**: Prevents API abuse with configurable request limits
- **Large Payload Protection**: 10MB limit on request bodies
- **CORS Handling**: Proper cross-origin resource sharing configuration
- **Connection Timeouts**: Graceful handling of slow or failed requests
- **Memory Management**: Efficient data structures and cleanup

### User Experience Edge Cases
- **Loading States**: Prevents multiple simultaneous submissions
- **Error Recovery**: Clear error messages with suggested actions
- **Session Management**: Automatic token verification and renewal
- **Offline Handling**: Graceful degradation when backend is unavailable

## 🚀 Production Considerations

### Enhanced Validation for Production

If this were a production application, the following validation enhancements would be implemented:

#### 1. **Medical Safety Validations**
```javascript
// Enhanced age-specific medical validations
const medicalValidations = {
  peptideContraindications: {
    pregnancy: 'Peptide therapy contraindicated during pregnancy',
    breastfeeding: 'Consult physician before use while breastfeeding',
    medicalConditions: ['diabetes', 'heart_disease', 'autoimmune_disorders']
  },
  requiredDisclosures: {
    minAge: 18,
    maxAge: 75, // Stricter upper limit for production
    medicalSupervision: true
  }
}
```

#### 2. **Advanced Input Sanitization**
- **HTML Entity Encoding**: Prevent XSS attacks
- **SQL Injection Protection**: Parameterized queries and input escaping
- **JSON Schema Validation**: Strict type checking for all API payloads
- **File Upload Validation**: If supporting document uploads
- **International Input Support**: Unicode handling and normalization

#### 3. **Enhanced Rate Limiting**
- **IP-based Throttling**: Different limits for authenticated vs anonymous users
- **Geographic Rate Limiting**: Region-specific restrictions
- **Behavioral Analysis**: Detection of suspicious usage patterns
- **Distributed Rate Limiting**: Redis-based limiting for multiple server instances

#### 4. **Security Headers and Middleware**
```javascript
// Production security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### 5. **Database Security**
- **Connection Encryption**: TLS for all database connections
- **Access Control**: Role-based database permissions
- **Data Encryption**: Encrypt sensitive user information at rest
- **Audit Logging**: Comprehensive database operation logging

#### 6. **API Security Enhancements**
- **API Key Management**: Rate limiting per API key
- **OAuth 2.0 Integration**: Enterprise authentication providers
- **Request Signing**: HMAC verification for sensitive endpoints
- **Webhook Security**: Secure callbacks for third-party integrations

#### 7. **Monitoring and Alerting**
- **Health Checks**: Comprehensive system health monitoring
- **Performance Metrics**: Response time and throughput tracking
- **Error Tracking**: Sentry or similar error monitoring
- **Security Monitoring**: Failed authentication attempt tracking

#### 8. **Data Privacy Compliance**
- **GDPR Compliance**: Right to deletion, data portability
- **HIPAA Considerations**: If handling health information
- **Cookie Consent**: Proper cookie management and consent
- **Data Retention Policies**: Automatic cleanup of old data

## 📊 API Endpoints

### Core Endpoints
- `POST /suggestions` - Get peptide recommendations
- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `GET /auth/verify` - Token verification
- `GET /analytics` - Usage analytics (admin)
- `GET /health` - System health check

### Authentication
The API supports both authenticated and anonymous usage:
- **Anonymous**: Basic recommendations without personalization
- **Authenticated**: Personalized recommendations with history tracking

## 🔒 Security Features

- **JWT Authentication**: Secure token-based user sessions
- **Input Validation**: Comprehensive Joi schema validation
- **Rate Limiting**: Express rate limiter with configurable limits
- **CORS Protection**: Configured for specific origins
- **Request Size Limits**: Protection against large payload attacks
- **Secure Headers**: Basic security headers implementation

## 📈 Analytics and Logging

### Application Logging
- **Structured Logging**: JSON format with Winston
- **Log Rotation**: Daily log files with automatic cleanup
- **Error Tracking**: Detailed error context and stack traces
- **Performance Metrics**: Request duration and success rates

### Analytics Features
- **Usage Tracking**: Request counts and goal selections
- **User Behavior**: Anonymous usage pattern analysis
- **Error Monitoring**: Failed request tracking and analysis
- **System Metrics**: Server health and performance data