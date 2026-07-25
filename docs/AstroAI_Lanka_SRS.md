# Software Requirements Specification (SRS)

## AstroAI Lanka – AI Digital Astrology and Ritual Guidance Platform

**Document Standard:** ISO/IEC/IEEE 29148  
**Document Version:** 1.0  
**Document Status:** Draft  
**Primary Purpose:** Software Development Guide  
**Prepared Date:** July 2026  

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the complete functional and non-functional requirements of the AstroAI Lanka platform.

This document is intended to guide:

- Product owners
- Software architects
- Frontend developers
- Backend developers
- Mobile developers
- AI engineers
- Quality assurance engineers
- UI/UX designers
- DevOps engineers
- System administrators
- Business stakeholders

The document shall be used as the primary reference for system design, implementation, testing, deployment, and future maintenance.

### 1.2 Product Scope

AstroAI Lanka is a multilingual digital astrology platform that allows users to provide their birth information, make payments, and receive automatically generated astrology reports.

The platform shall consist of:

1. Customer website
2. Customer mobile application
3. Admin portal
4. Backend API
5. Astrology calculation engine
6. AI report-generation service
7. Kundali and chart-generation service
8. PDF-generation service
9. Payment-processing service
10. WhatsApp chatbot and notification service
11. Email notification service
12. Analytics and reporting module

The system shall collect a customer's birth date, birth time, birth location, preferred language, and selected report type. It shall then calculate astrology data, generate a structured report, create a PDF, and deliver it through the user account, WhatsApp, and email.

### 1.3 Business Objectives

The system aims to:

- Automate astrology report generation
- Reduce manual processing time
- Support customers at any time of the day
- Provide reports in Sinhala, Tamil, and English
- Support Sri Lankan payment methods
- Deliver reports through WhatsApp and email
- Maintain consistent report quality and branding
- Support multiple astrology products
- Provide administrators with complete operational control
- Create a scalable digital astrology business

### 1.4 Intended Audience

This document is intended for:

- Business owners
- Product managers
- Development teams
- Testing teams
- DevOps teams
- Astrology content experts
- Finance administrators
- Customer-support officers
- Marketing administrators

### 1.5 Definitions and Abbreviations

| Term | Definition |
|---|---|
| AI | Artificial Intelligence |
| API | Application Programming Interface |
| Admin | Authorized platform administrator |
| Customer | User who purchases an astrology report |
| Kundali | Graphical representation of a birth chart |
| Lagna Chart | Primary astrology birth chart |
| Navamsa Chart | Divisional astrology chart |
| PDF | Portable Document Format |
| OTP | One-Time Password |
| PII | Personally Identifiable Information |
| RBAC | Role-Based Access Control |
| Report | Generated astrology document |
| Ephemeris | Astronomical data used for astrology calculations |
| Prompt Template | Controlled instructions sent to the AI service |
| Payment Gateway | Third-party service used to process payments |
| Order | Customer request to purchase a report |
| Background Job | Asynchronous server-side processing task |

---

## 2. Stakeholders and User Classes

### 2.1 Stakeholders

| Stakeholder | Responsibility |
|---|---|
| Customer | Purchases and receives astrology reports |
| Super Administrator | Controls the entire platform |
| Support Officer | Handles customer issues and report delivery |
| Finance Administrator | Manages payments, refunds, and revenue |
| Content Administrator | Manages report templates and AI prompts |
| Marketing Administrator | Manages promotions and discount codes |
| Astrology Expert | Reviews astrology rules and content |
| Development Team | Develops and maintains the system |
| Payment Provider | Processes customer payments |
| AI Provider | Generates report content |
| Messaging Provider | Delivers WhatsApp messages |
| Email Provider | Delivers email notifications |

### 2.2 User Classes

#### Guest User

A guest user shall be able to:

- View public pages
- View available report packages
- View prices
- Select a language
- View sample reports
- Register or log in

#### Registered Customer

A registered customer shall be able to:

- Manage a profile
- Create report orders
- Enter birth details
- Apply promotional codes
- Make payments
- View order status
- Download completed reports
- Request report redelivery
- View previous orders
- Contact customer support

#### Support Officer

A support officer shall be able to:

- Search customers and orders
- View order status
- View delivery status
- Resend completed reports
- Record support notes
- Escalate technical issues

#### Finance Administrator

A finance administrator shall be able to:

- View payment transactions
- Verify bank-transfer payments
- Approve or reject payment slips
- Process authorized refunds
- Export financial reports

#### Content Administrator

A content administrator shall be able to:

- Manage report templates
- Manage translations
- Manage AI prompt templates
- Create prompt versions
- Preview report output
- Submit content for approval

#### Super Administrator

A super administrator shall be able to:

- Manage users and administrators
- Configure integrations
- Manage roles and permissions
- Change product pricing
- Manage system settings
- Approve prompt versions
- View system logs
- Access all analytics
- Activate or deactivate services

---

## 3. System Overview

### 3.1 High-Level Components

The system shall include the following components:

#### Customer Website

A responsive web application for customer registration, ordering, payments, report viewing, and profile management.

#### Mobile Application

A mobile application for Android and iOS that provides customer-facing functionality.

#### Admin Portal

A secure management portal used by administrators to manage products, users, payments, reports, prompts, and analytics.

#### Backend API

A centralized API that provides services to the website, mobile application, admin portal, and external integrations.

#### Astrology Calculation Engine

A deterministic calculation service that processes birth information and calculates astrology-related data.

#### AI Report Service

A service that transforms calculated astrology data into customer-friendly written reports using approved prompt templates.

#### Kundali Generation Service

A service that generates Lagna, Navamsa, and other supported astrology charts as SVG or image files.

#### PDF Generation Service

A service that creates branded PDF reports containing charts, customer details, astrology findings, recommendations, and disclaimers.

#### Payment Service

A module that processes online payments and supports manual bank-transfer verification.

#### Messaging Service

A module that sends WhatsApp and email notifications.

#### Background Job Service

A queue-based service that handles long-running operations such as:

- Astrology calculations
- AI report generation
- PDF creation
- Email delivery
- WhatsApp delivery
- Retry processing

### 3.2 External Dependencies

The platform may use:

- OpenAI API or Google Gemini API
- Swiss Ephemeris or equivalent astronomical library
- WhatsApp Business Cloud API
- PayHere or another approved payment gateway
- Email delivery provider
- Cloud object storage
- Error monitoring service
- Analytics service
- Sri Lankan geolocation dataset

### 3.3 Operating Environment

The platform shall support:

- Modern desktop browsers
- Modern mobile browsers
- Android devices
- iOS devices
- Secure cloud-hosted infrastructure
- Relational databases
- Object storage
- Background job queues
- Containerized deployment environments

---

## 4. Assumptions and Constraints

### 4.1 Assumptions

- Customers shall provide accurate birth information.
- Internet access shall be required.
- Payment and messaging providers shall be available.
- Astrology experts shall provide approved rules and content.
- Sinhala and Tamil translations shall be reviewed by qualified reviewers.
- The business shall maintain valid third-party service accounts.

### 4.2 Constraints

- The system shall follow applicable Sri Lankan data-protection and payment requirements.
- WhatsApp integration shall use an official business API.
- Sensitive credentials shall not be exposed to client applications.
- Astrology calculations shall not rely only on generative AI.
- AI-generated content shall use controlled prompts and validated calculation data.
- The system shall not provide medical, legal, or financial advice.
- External service outages may delay report generation or delivery.

### 4.3 Ethical Content Constraints

The platform shall clearly state that astrology reports are provided for cultural, spiritual, or entertainment guidance.

The system shall not:

- Guarantee future outcomes
- Guarantee cures
- Diagnose health conditions
- Replace professional advice
- Use fear-based wording to force purchases
- Present paid rituals as compulsory
- Generate discriminatory content
- Make definitive predictions about death, serious illness, or unavoidable disasters

---

## 5. Business Rules

### BR-001 Payment Confirmation

A report shall not be released until the related payment is confirmed, except for authorized free orders.

### BR-002 Required Birth Information

A standard report shall require:

- Full name
- Birth date
- Birth time
- Birth location
- Preferred language

### BR-003 Unknown Birth Time

When the customer does not know the exact birth time:

- The system shall display an accuracy warning.
- The system may allow an approximate time for supported products.
- The report shall indicate that approximate information was used.

### BR-004 Price Snapshot

The order shall store:

- Product price
- Discount amount
- Tax amount
- Final payable amount

Future pricing changes shall not update previous orders.

### BR-005 Prompt Versioning

Every generated report shall store:

- Prompt-template version
- Calculation-rule version
- AI model used
- Generation timestamp

### BR-006 Report Versioning

A completed report shall not be silently overwritten.

A regenerated report shall create a new report version while preserving previous versions.

### BR-007 Promotional Code Validation

A promotional code shall only be accepted when:

- It is active
- It is within the valid period
- The usage limit is not exceeded
- The selected product is eligible
- The customer meets usage conditions

### BR-008 Refund Authorization

Only authorized finance users shall be permitted to approve refunds.

### BR-009 Delivery Retry

Failed WhatsApp and email deliveries shall be automatically retried according to configured retry rules.

### BR-010 Disclaimer

Every report shall contain the approved disclaimer.

---

## 6. Functional Requirements

## 6.1 Authentication and Account Management

### FR-AUTH-001

The system shall allow users to register using an email address or mobile number.

### FR-AUTH-002

The system shall verify the email address or mobile number using OTP or a verification link.

### FR-AUTH-003

The system shall allow registered users to log in securely.

### FR-AUTH-004

The system shall provide a password-reset process.

### FR-AUTH-005

The system shall prevent blocked users from creating new orders.

### FR-AUTH-006

The system shall allow users to log out.

### FR-AUTH-007

The system shall allow administrators to terminate active sessions when required.

### FR-AUTH-008

The system shall support optional social login in future releases.

---

## 6.2 Customer Profile Management

### FR-PRO-001

The system shall allow users to maintain:

- Full name
- Email address
- Mobile number
- WhatsApp number
- Preferred language
- Country
- Communication preferences

### FR-PRO-002

The system shall allow users to update profile information.

### FR-PRO-003

The system shall allow users to request account deletion.

### FR-PRO-004

The system shall require confirmation before processing account deletion.

### FR-PRO-005

The system shall allow users to manage marketing consent separately for email and WhatsApp.

---

## 6.3 Product Catalogue

### FR-CAT-001

The system shall display available astrology products.

### FR-CAT-002

Each product shall display:

- Product name
- Description
- Price
- Discounted price
- Estimated generation time
- Required information
- Supported languages
- Sample report
- Disclaimer

### FR-CAT-003

The system shall allow administrators to activate or deactivate products.

### FR-CAT-004

The system shall support multiple report types, including:

- Basic birth-chart report
- Detailed life report
- Annual forecast
- Marriage compatibility report
- Career guidance report
- Business astrology report
- Child birth-chart report
- Custom consultation report

### FR-CAT-005

Administrators shall be able to configure required fields for each product.

---

## 6.4 Birth Information Management

### FR-BIRTH-001

The system shall allow users to enter a birth date.

### FR-BIRTH-002

The system shall allow users to enter the birth time with hour and minute precision.

### FR-BIRTH-003

The system shall support an “Exact time unknown” option for permitted products.

### FR-BIRTH-004

The system shall allow users to search and select a birth location.

### FR-BIRTH-005

The selected location shall be mapped to:

- Country
- Province
- District
- City
- Latitude
- Longitude
- Time zone

### FR-BIRTH-006

The system shall allow users to review birth information before payment.

### FR-BIRTH-007

The system shall record whether the birth information is exact, estimated, or incomplete.

### FR-BIRTH-008

The system shall validate impossible dates and invalid times.

### FR-BIRTH-009

The system shall allow a customer to save multiple birth profiles.

---

## 6.5 Order and Checkout Management

### FR-ORD-001

The system shall allow users to select a report product and create an order.

### FR-ORD-002

The order shall include:

- Order number
- Customer
- Product
- Birth profile
- Language
- Price
- Discount
- Tax
- Final amount
- Payment status
- Report status
- Delivery status

### FR-ORD-003

The system shall display an order summary before payment.

### FR-ORD-004

The system shall allow users to apply a promotional code.

### FR-ORD-005

The system shall validate promotional codes before applying discounts.

### FR-ORD-006

The system shall generate a unique order number.

### FR-ORD-007

The system shall prevent duplicate payment processing for the same transaction.

### FR-ORD-008

The system shall allow customers to view order history.

### FR-ORD-009

The system shall support order statuses including:

- Draft
- Awaiting Payment
- Payment Under Review
- Paid
- Processing
- Generated
- Delivered
- Failed
- Cancelled
- Refunded

---

## 6.6 Payment Processing

### FR-PAY-001

The system shall support online card payments through an approved payment gateway.

### FR-PAY-002

The system shall support PayHere integration.

### FR-PAY-003

The system may support Dialog Genie or other approved local payment methods.

### FR-PAY-004

The system shall support bank-transfer payment with slip upload.

### FR-PAY-005

The system shall verify payment callbacks using signatures or provider-approved security methods.

### FR-PAY-006

The system shall store payment transaction references.

### FR-PAY-007

The system shall update the order status after successful payment.

### FR-PAY-008

The system shall allow finance administrators to approve or reject manual payments.

### FR-PAY-009

The system shall notify the customer when a payment is rejected.

### FR-PAY-010

The system shall support authorized refunds.

### FR-PAY-011

The system shall maintain a payment audit trail.

---

## 6.7 Astrology Calculation Engine

### FR-AST-001

The system shall calculate astrology data using validated astronomical calculation methods.

### FR-AST-002

The calculation engine shall use:

- Birth date
- Birth time
- Latitude
- Longitude
- Time zone
- Configured astrology rules

### FR-AST-003

The system shall calculate supported information such as:

- Lagna
- Nakshatra
- Planetary positions
- Houses
- Dasha periods
- Current planetary transits
- Supported Dosha conditions
- Navamsa information

### FR-AST-004

The system shall store raw calculation output separately from AI-generated text.

### FR-AST-005

The calculation engine shall produce structured machine-readable output.

### FR-AST-006

The system shall record the calculation-engine version.

### FR-AST-007

The system shall provide a calculation error when the supplied data is insufficient or invalid.

### FR-AST-008

The system shall allow approved astrology experts to manage configurable interpretation rules.

---

## 6.8 Kundali and Chart Generation

### FR-CHART-001

The system shall generate a Lagna chart.

### FR-CHART-002

The system shall generate a Navamsa chart.

### FR-CHART-003

The system shall generate charts as SVG, PNG, or another supported image format.

### FR-CHART-004

The generated chart shall display relevant planet positions and house information.

### FR-CHART-005

The system shall support chart labels in Sinhala, Tamil, and English.

### FR-CHART-006

The generated chart shall be included in the final PDF report.

### FR-CHART-007

The system shall allow administrators to preview chart templates.

---

## 6.9 AI Report Generation

### FR-AI-001

The system shall send structured astrology data to the configured AI service.

### FR-AI-002

The AI service shall not perform the primary astronomy calculations.

### FR-AI-003

The system shall use controlled prompt templates.

### FR-AI-004

The prompt shall include:

- Structured astrology data
- Customer language
- Product type
- Report sections
- Content restrictions
- Disclaimer rules

### FR-AI-005

The system shall generate reports in Sinhala, Tamil, or English.

### FR-AI-006

The system shall validate AI output before PDF generation.

### FR-AI-007

The system shall detect empty, malformed, or incomplete AI responses.

### FR-AI-008

The system shall retry failed AI requests according to configured retry rules.

### FR-AI-009

The system shall record:

- AI provider
- Model
- Prompt version
- Input token usage
- Output token usage
- Generation status

### FR-AI-010

The system shall support administrator-controlled prompt testing.

### FR-AI-011

Prompt changes shall require versioning.

### FR-AI-012

The system shall allow a report to be marked for manual review.

---

## 6.10 Report Content

### FR-REP-001

The generated report shall include:

1. Cover page
2. Customer details
3. Birth information
4. Lagna chart
5. Navamsa chart
6. Birth-star analysis
7. Lagna analysis
8. Dasha analysis
9. Current transit analysis
10. Future guidance
11. Identified challenges
12. Recommended spiritual or cultural practices
13. Disclaimer

### FR-REP-002

The report may include recommendations such as:

- Buddhist religious practices
- Bodhi Pooja
- Charitable activities
- Dana
- Meditation or positive habits
- Traditional religious observances
- Gemstone guidance
- Cultural rituals

### FR-REP-003

Recommendations shall use non-coercive language.

### FR-REP-004

The report shall not guarantee outcomes.

### FR-REP-005

The report shall clearly distinguish guidance from factual certainty.

### FR-REP-006

The report shall include the report-generation date.

### FR-REP-007

The report shall include a unique report reference number.

---

## 6.11 PDF Generation

### FR-PDF-001

The system shall generate a branded PDF report.

### FR-PDF-002

The PDF shall contain:

- Brand logo
- Report title
- Customer name
- Charts
- Structured sections
- Page numbers
- Disclaimer
- Report reference

### FR-PDF-003

The system shall support Unicode Sinhala and Tamil fonts.

### FR-PDF-004

The PDF layout shall be responsive to variable content length.

### FR-PDF-005

The PDF shall be stored in secure object storage.

### FR-PDF-006

The system shall generate time-limited download links.

### FR-PDF-007

The system shall support report versioning.

### FR-PDF-008

Administrators shall be able to preview the PDF before manual release when review is required.

---

## 6.12 WhatsApp Integration

### FR-WA-001

The system shall send order notifications through WhatsApp.

### FR-WA-002

The system shall send completed reports through WhatsApp when permitted by the provider.

### FR-WA-003

The system shall use approved WhatsApp message templates.

### FR-WA-004

The system shall record delivery status.

### FR-WA-005

The system shall retry failed messages.

### FR-WA-006

The system shall allow customers to opt out of promotional WhatsApp messages.

### FR-WA-007

The WhatsApp chatbot shall allow users to:

- Select a language
- Select a report type
- Provide birth details
- Receive a payment link
- Check order status
- Receive a report link
- Contact support

### FR-WA-008

The chatbot shall transfer unsupported requests to customer support.

---

## 6.13 Email Notifications

### FR-EMAIL-001

The system shall send email notifications for:

- Registration verification
- Payment confirmation
- Payment rejection
- Order processing
- Report completion
- Report delivery
- Password reset
- Refund confirmation

### FR-EMAIL-002

The system shall support multilingual email templates.

### FR-EMAIL-003

The system shall record email delivery status.

### FR-EMAIL-004

The system shall retry failed email delivery.

### FR-EMAIL-005

The system shall include a secure report link in the completion email.

---

## 6.14 Customer Report Access

### FR-ACCESS-001

The customer shall be able to view completed reports from the account dashboard.

### FR-ACCESS-002

The customer shall be able to download the PDF.

### FR-ACCESS-003

The customer shall be able to request email or WhatsApp redelivery.

### FR-ACCESS-004

The system shall prevent unauthorized users from accessing another customer’s report.

### FR-ACCESS-005

The system shall display report-generation and delivery statuses.

---

## 6.15 Admin Product and Pricing Management

### FR-ADMIN-001

Administrators shall be able to create, update, activate, and deactivate products.

### FR-ADMIN-002

Administrators shall be able to change product pricing.

### FR-ADMIN-003

The system shall maintain pricing history.

### FR-ADMIN-004

Administrators shall be able to configure:

- Currency
- Tax
- Discounts
- Product availability
- Supported languages
- Generation priority
- Estimated delivery time

---

## 6.16 Promotional Code Management

### FR-PROMO-001

Administrators shall be able to create promotional codes.

### FR-PROMO-002

A promotional code shall support:

- Fixed discount
- Percentage discount
- Start date
- End date
- Usage limit
- Customer usage limit
- Eligible products
- Minimum order value
- Active status

### FR-PROMO-003

The system shall record promotional-code usage.

### FR-PROMO-004

The system shall prevent invalid or expired promotional codes from being used.

---

## 6.17 AI Prompt Management

### FR-PROMPT-001

Authorized administrators shall be able to create prompt templates.

### FR-PROMPT-002

Each prompt template shall have:

- Name
- Product
- Language
- Version
- Status
- Prompt content
- Created by
- Approved by
- Created date

### FR-PROMPT-003

The system shall support Draft, Active, Inactive, and Archived statuses.

### FR-PROMPT-004

Only approved prompt versions shall be used in production.

### FR-PROMPT-005

The system shall allow administrators to test prompts using sample data.

### FR-PROMPT-006

The system shall maintain complete prompt-change history.

---

## 6.18 Analytics Dashboard

### FR-ANA-001

The system shall display:

- Daily orders
- Monthly orders
- Completed reports
- Failed reports
- Total revenue
- Discount value
- Refund value
- Payment method distribution
- Product sales
- Language distribution
- Delivery success rate

### FR-ANA-002

The system shall allow filtering by date range.

### FR-ANA-003

The system shall allow reports to be exported as CSV or Excel.

### FR-ANA-004

The system shall display generation-performance metrics.

### FR-ANA-005

The system shall display failed integration counts.

---

## 6.19 Support Management

### FR-SUP-001

The system shall allow support officers to search orders.

### FR-SUP-002

The system shall allow support officers to record internal notes.

### FR-SUP-003

The system shall allow support officers to resend reports.

### FR-SUP-004

The system shall maintain a support action history.

### FR-SUP-005

Support users shall not be allowed to edit payment or astrology calculation data.

---

## 6.20 Audit Logging

### FR-AUD-001

The system shall log important administrative actions.

### FR-AUD-002

Audit records shall include:

- User
- Action
- Entity
- Previous value
- New value
- Timestamp
- IP address
- Device information

### FR-AUD-003

Audit logs shall not be editable by normal administrators.

### FR-AUD-004

The system shall support audit-log search and export.

---

## 7. External Interface Requirements

## 7.1 User Interface Requirements

The customer interface shall:

- Be responsive
- Support Sinhala, Tamil, and English
- Use clear form validation
- Provide progress indicators
- Provide accessible navigation
- Support mobile-first layouts
- Clearly display payment and report statuses

The admin portal shall:

- Use role-based navigation
- Provide searchable tables
- Support filtering and exporting
- Display operational alerts
- Provide dashboards and charts
- Support desktop and tablet layouts

## 7.2 API Requirements

The API shall:

- Use HTTPS
- Use JSON for request and response bodies
- Use consistent status codes
- Provide authentication and authorization
- Validate all request data
- Provide structured error responses
- Support API versioning
- Support rate limiting
- Maintain request logs

## 7.3 Payment Gateway Interface

The payment interface shall support:

- Payment initiation
- Redirect URL
- Success URL
- Failure URL
- Cancellation URL
- Webhook or callback verification
- Transaction reference
- Payment status query

## 7.4 AI Provider Interface

The AI interface shall support:

- Structured prompt submission
- Language selection
- Model configuration
- Timeout handling
- Retry handling
- Usage tracking
- Response validation
- Provider fallback in future releases

## 7.5 WhatsApp Interface

The WhatsApp interface shall support:

- Approved templates
- Text messages
- Interactive responses
- Secure report links
- Delivery callbacks
- Failure handling
- Opt-out handling

## 7.6 Email Interface

The email interface shall support:

- HTML emails
- Plain-text fallback
- Secure links
- Delivery events
- Bounce handling
- Multilingual templates

---

## 8. Data Requirements

## 8.1 Main Data Entities

The system shall include the following primary entities:

- User
- Customer Profile
- Administrator
- Role
- Permission
- Birth Profile
- Location
- Product
- Product Price
- Promotion
- Order
- Order Item
- Payment
- Payment Attachment
- Astrology Calculation
- Chart
- Prompt Template
- Prompt Version
- Generated Report
- Report Version
- Delivery Record
- Email Template
- WhatsApp Template
- Support Note
- Refund
- Audit Log
- System Setting

## 8.2 Data Retention

The system shall define retention periods for:

- Customer profiles
- Birth information
- Orders
- Payments
- Reports
- Delivery logs
- AI request metadata
- Audit logs
- Deleted accounts

## 8.3 Data Validation

The system shall validate:

- Email addresses
- Mobile numbers
- WhatsApp numbers
- Dates
- Times
- Coordinates
- Prices
- Discounts
- Payment references
- File types
- File sizes
- Supported languages

## 8.4 Data Privacy

The system shall:

- Encrypt sensitive information in transit
- Restrict access to birth data
- Use role-based permissions
- Avoid exposing internal IDs
- Record consent
- Support account deletion requests
- Provide privacy-policy access
- Limit data shared with external AI services

---

## 9. Non-Functional Requirements

## 9.1 Performance

### NFR-PERF-001

Public pages should load within 3 seconds under normal network conditions.

### NFR-PERF-002

Standard API requests should complete within 2 seconds, excluding third-party processing.

### NFR-PERF-003

The system should generate a standard report within 5 minutes under normal conditions.

### NFR-PERF-004

Long-running report generation shall be processed through background jobs.

### NFR-PERF-005

The system shall support horizontal scaling.

## 9.2 Availability

### NFR-AVL-001

The platform should achieve at least 99.5% monthly availability, excluding scheduled maintenance.

### NFR-AVL-002

Failure of the AI service shall not corrupt orders or payments.

### NFR-AVL-003

Failed jobs shall be retryable.

### NFR-AVL-004

The system shall provide health-check endpoints.

## 9.3 Security

### NFR-SEC-001

All network communication shall use HTTPS.

### NFR-SEC-002

Passwords shall be stored using secure password hashing.

### NFR-SEC-003

Administrative access shall use strong authentication.

### NFR-SEC-004

The system shall implement role-based access control.

### NFR-SEC-005

The system shall protect against common web vulnerabilities.

### NFR-SEC-006

Payment card details shall not be stored unless handled through a compliant provider.

### NFR-SEC-007

Secrets shall be stored in secure environment configuration or secret-management tools.

### NFR-SEC-008

Sensitive actions shall be logged.

### NFR-SEC-009

The system shall implement rate limiting.

### NFR-SEC-010

Uploaded files shall be validated before storage.

## 9.4 Privacy

### NFR-PRV-001

The system shall collect only required personal information.

### NFR-PRV-002

The system shall display a privacy notice before collecting birth information.

### NFR-PRV-003

Customers shall be able to manage communication consent.

### NFR-PRV-004

The system shall not send unnecessary personal information to AI providers.

### NFR-PRV-005

Report download links shall expire after a configurable period.

## 9.5 Usability

### NFR-USA-001

The platform shall support Sinhala, Tamil, and English.

### NFR-USA-002

The checkout process shall clearly show progress.

### NFR-USA-003

Validation messages shall explain how to correct invalid data.

### NFR-USA-004

The website shall be usable on mobile devices.

### NFR-USA-005

The interface should follow recognized accessibility practices.

## 9.6 Maintainability

### NFR-MNT-001

The system shall use modular architecture.

### NFR-MNT-002

Business logic shall be separated from UI code.

### NFR-MNT-003

Integration services shall use configurable adapters.

### NFR-MNT-004

The system shall maintain technical logs.

### NFR-MNT-005

The codebase shall include automated tests.

## 9.7 Scalability

### NFR-SCL-001

The backend shall support multiple application instances.

### NFR-SCL-002

Report generation workers shall scale independently.

### NFR-SCL-003

Static files and reports shall use scalable object storage.

### NFR-SCL-004

The system shall support increased customer and order volumes without major redesign.

## 9.8 Compatibility

### NFR-COM-001

The website shall support current major versions of:

- Google Chrome
- Microsoft Edge
- Mozilla Firefox
- Apple Safari

### NFR-COM-002

The mobile application shall support approved Android and iOS versions.

## 9.9 Localization

### NFR-LOC-001

All customer-facing content shall support translation.

### NFR-LOC-002

Dates, times, numbers, and currencies shall be displayed according to the selected locale.

### NFR-LOC-003

Sinhala and Tamil text shall render correctly in the application and PDF reports.

---

## 10. System Workflows

## 10.1 Customer Report Purchase Workflow

1. Customer opens the website or mobile application.
2. Customer selects a language.
3. Customer selects a report product.
4. Customer registers or logs in.
5. Customer enters or selects a birth profile.
6. Customer reviews the entered information.
7. Customer applies a promotional code if available.
8. Customer selects a payment method.
9. Customer completes payment.
10. The system verifies payment.
11. The order is added to the report-generation queue.
12. The astrology engine calculates structured data.
13. The system generates Kundali charts.
14. The AI service generates report content.
15. The system validates the generated content.
16. The PDF service creates the final report.
17. The report is stored securely.
18. The system sends email and WhatsApp notifications.
19. The customer downloads the report.

## 10.2 Bank Transfer Workflow

1. Customer selects bank transfer.
2. System displays bank details.
3. Customer uploads payment slip.
4. Order status changes to Payment Under Review.
5. Finance administrator reviews the payment.
6. Finance administrator approves or rejects it.
7. Approved orders proceed to generation.
8. Rejected orders notify the customer.

## 10.3 Report Failure Workflow

1. A generation step fails.
2. The system records the error.
3. The background job retries the task.
4. If all retries fail, the order is marked Failed.
5. Administrators receive an alert.
6. Support staff may restart the job.
7. The customer receives an appropriate delay notification.

## 10.4 Report Regeneration Workflow

1. Authorized administrator opens the order.
2. Administrator selects Regenerate Report.
3. Administrator enters a reason.
4. System creates a new report-generation job.
5. The new report is stored as a new version.
6. Previous report versions remain available for audit.
7. Customer receives the latest approved version.

---

## 11. Error Handling

The system shall provide clear error messages for:

- Invalid birth details
- Unsupported location
- Failed payment
- Payment verification delay
- AI service failure
- Chart-generation failure
- PDF-generation failure
- WhatsApp delivery failure
- Email delivery failure
- Expired report links
- Unauthorized access
- Invalid promotional codes

Technical error details shall not be exposed to customers.

---

## 12. Logging and Monitoring

The system shall monitor:

- Application errors
- API failures
- Payment callbacks
- AI request failures
- Report-generation time
- Queue size
- Failed background jobs
- Email delivery failures
- WhatsApp delivery failures
- Storage usage
- Database health
- Authentication failures

Administrators shall receive alerts for critical failures.

---

## 13. Backup and Disaster Recovery

### DR-001

The database shall be backed up regularly.

### DR-002

Generated reports and uploaded payment slips shall be stored with redundancy.

### DR-003

Backup restoration procedures shall be tested periodically.

### DR-004

The business shall define Recovery Point Objective and Recovery Time Objective targets.

### DR-005

Critical configuration and prompt templates shall be included in backups.

---

## 14. Suggested Technical Architecture

The following architecture is recommended but may be adjusted during system design.

### Frontend

- Next.js or React
- TypeScript
- Tailwind CSS
- Responsive web design

### Mobile

- React Native or Flutter

### Backend

- NestJS, FastAPI, or equivalent backend framework
- REST API
- Background job queue
- Modular service architecture

### Database

- PostgreSQL

### Queue and Cache

- Redis
- BullMQ, Celery, or equivalent job processor

### AI Integration

- OpenAI API
- Google Gemini API
- Provider abstraction layer

### Astrology Engine

- Swiss Ephemeris
- Dedicated calculation service

### File Storage

- Amazon S3
- Cloudflare R2
- Equivalent object storage

### PDF Generation

- HTML-to-PDF service
- Headless Chromium
- Dedicated PDF worker

### Payments

- PayHere
- Approved card gateway
- Manual bank transfer

### Messaging

- WhatsApp Business Cloud API
- Transactional email provider

### Deployment

- Docker
- CI/CD pipeline
- Cloud-hosted infrastructure
- Monitoring and centralized logging

---

## 15. Acceptance Criteria

The first production release shall be accepted when:

1. Customers can register and log in.
2. Customers can create and manage birth profiles.
3. Customers can select and purchase a report.
4. Online and manual payment flows work correctly.
5. Astrology calculations are generated using validated rules.
6. Lagna and Navamsa charts are generated.
7. AI reports are generated in the selected language.
8. A branded PDF is created successfully.
9. Reports can be downloaded securely.
10. Email delivery works.
11. WhatsApp delivery works.
12. Administrators can manage products and prices.
13. Administrators can manage promotional codes.
14. Administrators can manage AI prompt versions.
15. Payment and report statuses are auditable.
16. Analytics display correct order and revenue information.
17. Access permissions prevent unauthorized data access.
18. Core workflows pass functional and security testing.
19. Backup and recovery procedures are documented.
20. The platform displays the approved astrology disclaimer.

---

## 16. Future Enhancements

The following features may be included in future releases:

- Live video consultation booking
- Human astrologer marketplace
- Subscription-based monthly reports
- Daily horoscope notifications
- Family account management
- Horoscope matching
- Voice-based chatbot
- AI voice report
- Gift report purchases
- Loyalty points
- Referral program
- Astrology course marketplace
- Temple and ritual-service booking
- Multiple AI provider fallback
- International payment support
- Advanced business intelligence dashboards

---

## 17. Requirement Traceability

Each requirement shall be mapped to:

- Business objective
- Design component
- Development task
- Test case
- Release version
- Implementation status

A Requirement Traceability Matrix should contain:

| Requirement ID | Description | Module | Priority | Test Case | Status |
|---|---|---|---|---|---|
| FR-AUTH-001 | Customer registration | Authentication | High | TC-AUTH-001 | Pending |
| FR-PAY-001 | Online payment | Payment | High | TC-PAY-001 | Pending |
| FR-AST-001 | Astrology calculation | Astrology Engine | High | TC-AST-001 | Pending |
| FR-AI-001 | AI report generation | AI Service | High | TC-AI-001 | Pending |
| FR-PDF-001 | PDF generation | PDF Service | High | TC-PDF-001 | Pending |

---

## 18. Approval

| Role | Name | Signature | Date |
|---|---|---|---|
| Product Owner |  |  |  |
| Technical Lead |  |  |  |
| Astrology Subject Expert |  |  |  |
| QA Lead |  |  |  |
| Business Owner |  |  |  |

---

## 19. Disclaimer

AstroAI Lanka provides astrology-related content for cultural, spiritual, and entertainment guidance. Generated reports do not guarantee future outcomes and shall not replace professional medical, legal, financial, or psychological advice.
