// ============================================================
// CrimeGPT — Mock Data
// Realistic cybercrime investigation data for frontend demo
// ============================================================

import type {
  Case, Officer, DashboardStats, MonthlyTrend, CategoryDistribution,
  StatusDistribution, RecentActivity, Report, InvestigationAlert,
  FraudTrend, UserProfile, NotificationPreference,
} from '@/types';

// ── Officers ──────────────────────────────────────────────────

export const officers: Officer[] = [
  { id: 'OFF-001', name: 'Inspector Rajesh Kumar', rank: 'Inspector', department: 'Cyber Crime Cell, Delhi' },
  { id: 'OFF-002', name: 'SI Priya Sharma', rank: 'Sub-Inspector', department: 'Cyber Crime Cell, Mumbai' },
  { id: 'OFF-003', name: 'Inspector Vikram Singh', rank: 'Inspector', department: 'Cyber Crime Division, Bangalore' },
  { id: 'OFF-004', name: 'ASI Meera Patel', rank: 'Assistant Sub-Inspector', department: 'Cyber Crime Cell, Ahmedabad' },
  { id: 'OFF-005', name: 'Inspector Arjun Reddy', rank: 'Inspector', department: 'Cyber Crime Cell, Hyderabad' },
  { id: 'OFF-006', name: 'SI Kavitha Nair', rank: 'Sub-Inspector', department: 'Cyber Crime Division, Chennai' },
];

// ── Cases ─────────────────────────────────────────────────────

export const cases: Case[] = [
  {
    id: 'CASE-2025-001',
    title: 'Investment Scam via Telegram Trading Group',
    description: 'Victim lured into fraudulent crypto trading group on Telegram promising 300% returns. Multiple victims identified across Delhi NCR.',
    fraudCategory: 'Investment Scam',
    priority: 'Critical',
    status: 'Under Investigation',
    victim: {
      name: 'Amit Verma',
      contact: '+91-98765-43210',
      email: 'amit.verma@gmail.com',
      address: '45, Sector 18, Noida, UP - 201301',
      age: 34,
      occupation: 'Software Engineer',
    },
    assignedOfficer: officers[0],
    amountLost: 1250000,
    createdAt: '2025-06-01T09:30:00Z',
    updatedAt: '2025-06-14T16:45:00Z',
    tags: ['telegram', 'crypto', 'multi-victim', 'organized'],
    complaintText: `I, Amit Verma, wish to file a complaint regarding a sophisticated investment fraud. On May 15, 2025, I received an invitation to join a Telegram group called "Alpha Traders Pro" from an unknown number (+91-87654-32100). The group admin, who identified himself as "Rohan Kapoor - Senior Analyst at Goldman Sachs," shared daily stock tips and crypto trading signals that appeared highly profitable.\n\nInitially, I was asked to invest ₹10,000 through a website (www.alphatraderspro.in) which showed impressive returns of 40% within 3 days. Encouraged by these results, I invested additional amounts:\n\n- May 18: ₹50,000 via UPI (rohank@oksbi)\n- May 22: ₹2,00,000 via bank transfer\n- May 28: ₹3,00,000 via UPI (invest.alpha@paytm)\n- June 1: ₹7,00,000 via NEFT to A/C 4532xxxx1876\n\nWhen I attempted to withdraw my profits of ₹18,50,000 shown on the platform, I was asked to pay a "withdrawal fee" of ₹1,50,000. After I refused, all communication was terminated, the Telegram group was deleted, and the website went offline.`,
    entities: [
      { id: 'ENT-001', type: 'Phone Number', value: '+91-87654-32100', label: 'Primary Suspect Number', riskLevel: 'High', associatedCases: 4, firstSeen: '2025-05-15', lastSeen: '2025-06-01', riskScore: 88, statesDetected: ['Delhi', 'Haryana', 'UP'], connectedEntities: ['rohank@oksbi', '@alphatraders_rohan', 'www.alphatraderspro.in'], investigatorNotes: 'IMEI traced to Mewat region. Number used in 4 separate investment scam complaints across NCR. CDR analysis pending from Airtel.' },
      { id: 'ENT-002', type: 'UPI ID', value: 'rohank@oksbi', label: 'Suspect UPI ID 1', riskLevel: 'High', associatedCases: 3, firstSeen: '2025-05-18', lastSeen: '2025-05-28', riskScore: 96, statesDetected: ['Gujarat', 'Delhi', 'Maharashtra'], connectedEntities: ['+91-87654-32100', 'A/C 4532xxxx1876 (SBI)', 'invest.alpha@paytm'], investigatorNotes: 'KYC linked to Rajesh Yadav (Aadhaar: XXXX-XXXX-7842). Account flagged by NPCI for suspicious velocity — 47 transactions in 24h. Bank freeze request sent.' },
      { id: 'ENT-003', type: 'UPI ID', value: 'invest.alpha@paytm', label: 'Suspect UPI ID 2', riskLevel: 'High', associatedCases: 2, firstSeen: '2025-05-28', lastSeen: '2025-06-01', riskScore: 82, statesDetected: ['Delhi', 'Rajasthan'], connectedEntities: ['rohank@oksbi', '@alphatraders_rohan'], investigatorNotes: 'Paytm merchant account registered under fake GST. Account suspended by Paytm compliance on 02-Jun-2025.' },
      { id: 'ENT-004', type: 'Website', value: 'www.alphatraderspro.in', label: 'Fraudulent Trading Platform', riskLevel: 'High', associatedCases: 6, firstSeen: '2025-04-10', lastSeen: '2025-06-02', riskScore: 99, statesDetected: ['Pan-India'], connectedEntities: ['support@alphatraderspro.in', '+91-87654-32100', '@alphatraders_rohan'], investigatorNotes: 'Domain registered via NameCheap with WHOIS guard. Hosted on 185.234.72.xx (Bulgaria). Takedown request sent to registrar and CERT-In.' },
      { id: 'ENT-005', type: 'Telegram Handle', value: '@alphatraders_rohan', label: 'Suspect Telegram Account', riskLevel: 'High', associatedCases: 4, firstSeen: '2025-05-10', lastSeen: '2025-06-01', riskScore: 91, statesDetected: ['Delhi', 'Haryana'], connectedEntities: ['+91-87654-32100', 'www.alphatraderspro.in', 'rohank@oksbi'], investigatorNotes: 'Account was admin of 3 known fraud groups. Telegram legal request submitted for subscriber info and IP logs. Group had ~2,400 members before deletion.' },
      { id: 'ENT-006', type: 'Bank Account', value: 'A/C 4532xxxx1876 (SBI)', label: 'Suspect Bank Account', riskLevel: 'High', associatedCases: 5, firstSeen: '2025-05-01', lastSeen: '2025-06-01', riskScore: 94, statesDetected: ['Delhi', 'UP', 'Bihar'], connectedEntities: ['rohank@oksbi', 'invest.alpha@paytm'], investigatorNotes: 'Account holder: Rajesh Yadav. Account shows ₹45L inflow in May 2025. Immediate fund layering to 12 downstream accounts detected. Section 102 CrPC freeze order issued.' },
      { id: 'ENT-007', type: 'Email Address', value: 'support@alphatraderspro.in', label: 'Fraudulent Support Email', riskLevel: 'Medium', associatedCases: 3, firstSeen: '2025-05-15', lastSeen: '2025-06-01', riskScore: 68, statesDetected: ['Delhi'], connectedEntities: ['www.alphatraderspro.in'], investigatorNotes: 'Auto-reply email configured on domain. No direct human interaction. Google Workspace records subpoena pending.' },
    ],
    evidence: [
      { id: 'EV-001', type: 'Screenshot', fileName: 'telegram_group_invite.png', fileSize: '2.4 MB', uploadedAt: '2025-06-01T10:00:00Z', uploadedBy: 'Amit Verma', description: 'Screenshot of initial Telegram group invitation showing fake "Goldman Sachs Analyst" profile and promises of 300% returns.' },
      { id: 'EV-002', type: 'Chat Export', fileName: 'telegram_chat_history.html', fileSize: '15.8 MB', uploadedAt: '2025-06-01T10:15:00Z', uploadedBy: 'Amit Verma', description: 'Full chat export from Telegram group Alpha Traders Pro containing 847 messages, fake profit screenshots, and payment instructions.' },
      { id: 'EV-003', type: 'Bank Statement', fileName: 'sbi_statement_may2025.pdf', fileSize: '1.2 MB', uploadedAt: '2025-06-02T14:30:00Z', uploadedBy: 'SI Priya Sharma', description: 'Bank statement showing five fraudulent outgoing transactions totaling ₹12,50,000 to identified suspect accounts.' },
      { id: 'EV-004', type: 'Screenshot', fileName: 'fake_trading_platform.png', fileSize: '3.1 MB', uploadedAt: '2025-06-01T10:30:00Z', uploadedBy: 'Amit Verma', description: 'Screenshot of the fake trading dashboard showing fabricated 289% profit with withdraw button that triggers fee demand.' },
      { id: 'EV-005', type: 'Transaction Log', fileName: 'upi_transaction_records.pdf', fileSize: '850 KB', uploadedAt: '2025-06-03T09:00:00Z', uploadedBy: 'Inspector Rajesh Kumar', description: 'UPI transaction logs obtained from NPCI showing full payment chain including downstream layering to mule accounts.' },
      { id: 'EV-006', type: 'Call Recording', fileName: 'victim_suspect_call.mp3', fileSize: '4.2 MB', uploadedAt: '2025-06-04T11:00:00Z', uploadedBy: 'Inspector Rajesh Kumar', description: 'Recorded call between victim and suspect discussing "withdrawal fees" — key evidence of social engineering technique.' },
      { id: 'EV-007', type: 'Email Thread', fileName: 'support_email_chain.eml', fileSize: '320 KB', uploadedAt: '2025-06-04T14:00:00Z', uploadedBy: 'SI Priya Sharma', description: 'Email thread from support@alphatraderspro.in with fake account verification and tax compliance notifications.' },
    ],
    timeline: [
      { id: 'TL-001', time: '10:30 AM', date: '2025-05-15', title: 'Initial Contact', description: 'Victim received Telegram group invitation from unknown number +91-87654-32100 with "exclusive trading opportunity" pitch.', type: 'contact', riskScore: 45, linkedEntityIds: ['ENT-001'], investigatorNotes: 'Standard pig-butchering approach. Number also used in CASE-2025-004 and CASE-2025-010.' },
      { id: 'TL-002', time: '11:15 AM', date: '2025-05-15', title: 'Telegram Group Join', description: 'Victim joined "Alpha Traders Pro" Telegram group administered by @alphatraders_rohan. Group had ~2,400 members (likely inflated with bots).', type: 'communication', riskScore: 55, linkedEntityIds: ['ENT-005'], linkedEvidenceIds: ['EV-001'], investigatorNotes: 'Group used coordinated fake testimonials. Bot-inflated member count to create false legitimacy.' },
      { id: 'TL-003', time: '02:00 PM', date: '2025-05-17', title: 'Initial Investment', description: 'Victim invested ₹10,000 through fraudulent website www.alphatraderspro.in. Dashboard showed 40% returns within hours.', type: 'transaction', riskScore: 72, linkedEntityIds: ['ENT-004'], linkedEvidenceIds: ['EV-004'], investigatorNotes: 'Classic "small win" phase — low initial investment with fabricated returns to build trust.' },
      { id: 'TL-004', time: '09:45 AM', date: '2025-05-18', title: 'UPI Transfer — ₹50,000', description: 'UPI transfer of ₹50,000 to rohank@oksbi. Victim instructed to "top up" for access to "premium signals."', type: 'transaction', riskScore: 85, linkedEntityIds: ['ENT-002'], linkedEvidenceIds: ['EV-005'], investigatorNotes: 'Transaction velocity increased. Suspect applied urgency tactics ("limited time offer for VIP tier").' },
      { id: 'TL-005', time: '11:00 AM', date: '2025-05-22', title: 'Bank Transfer — ₹2,00,000', description: 'NEFT of ₹2,00,000 to suspect bank account A/C 4532xxxx1876. Victim was shown "locked profit" of ₹8,40,000.', type: 'transaction', riskScore: 92, linkedEntityIds: ['ENT-006'], linkedEvidenceIds: ['EV-003'], investigatorNotes: 'Significant escalation. Victim\'s savings account balance dropped to ₹1.2L. Fund layering detected within 30min of receipt.' },
      { id: 'TL-006', time: '03:30 PM', date: '2025-05-28', title: 'Large UPI Transfer — ₹3,00,000', description: 'UPI transfer of ₹3,00,000 to invest.alpha@paytm. Victim borrowed from family to make this payment.', type: 'transaction', riskScore: 95, linkedEntityIds: ['ENT-003'], linkedEvidenceIds: ['EV-005'], investigatorNotes: 'Victim had started borrowing — classic sunk cost manipulation by suspect. Paytm merchant account showed 23 similar incoming txns that week.' },
      { id: 'TL-007', time: '10:00 AM', date: '2025-06-01', title: 'Final Transfer — ₹7,00,000', description: 'NEFT of ₹7,00,000 to A/C 4532xxxx1876. Largest single transaction. Victim transferred from FD proceeds.', type: 'transaction', riskScore: 98, linkedEntityIds: ['ENT-006'], linkedEvidenceIds: ['EV-003', 'EV-005'], investigatorNotes: 'Victim broke FD to fund this. Total exposure now ₹12.5L. Account showed immediate withdrawal to 4 different accounts within 15 minutes.' },
      { id: 'TL-008', time: '04:00 PM', date: '2025-06-01', title: 'Withdrawal Denied', description: 'Victim requested withdrawal of ₹18,50,000 shown as profit. Told to pay "withdrawal processing fee" of ₹1,50,000.', type: 'escalation', riskScore: 88, linkedEntityIds: ['ENT-004', 'ENT-007'], linkedEvidenceIds: ['EV-006', 'EV-007'], investigatorNotes: 'Exit scam phase. "Withdrawal fee" is the secondary extraction point. Email from support@alphatraderspro.in cited fake "RBI compliance" requirement.' },
      { id: 'TL-009', time: '06:30 PM', date: '2025-06-01', title: 'Communication Terminated', description: 'Telegram group deleted by admin. Website www.alphatraderspro.in taken offline. All suspect numbers unreachable.', type: 'action', riskScore: 70, linkedEntityIds: ['ENT-004', 'ENT-005'], investigatorNotes: 'Full infrastructure teardown in under 2 hours. Suspect likely has automated takedown scripts. Domain DNS records preserved by CERT-In before deletion.' },
      { id: 'TL-010', time: '09:30 AM', date: '2025-06-02', title: 'FIR Filed', description: 'Complaint registered at Cyber Crime Cell, Delhi. Case assigned to Inspector Rajesh Kumar. Evidence collection initiated.', type: 'action', riskScore: 20, linkedEvidenceIds: ['EV-001', 'EV-002', 'EV-003', 'EV-004'], investigatorNotes: 'FIR registered under Sections 66C, 66D of IT Act and Section 420 IPC. NCRP complaint ID: CR-20250602-0847.' },
    ],
  },
  {
    id: 'CASE-2025-002',
    title: 'UPI Fraud via Fake Customer Care',
    description: 'Victim contacted fake customer care number found through Google search. Fraudsters gained remote access to phone via screen-sharing app.',
    fraudCategory: 'UPI Fraud',
    priority: 'High',
    status: 'Evidence Collection',
    victim: {
      name: 'Sunita Devi',
      contact: '+91-99887-76655',
      email: 'sunita.d@yahoo.com',
      address: '12, Ashok Nagar, Jaipur, Rajasthan - 302001',
      age: 52,
      occupation: 'Homemaker',
    },
    assignedOfficer: officers[1],
    amountLost: 287000,
    createdAt: '2025-06-05T11:00:00Z',
    updatedAt: '2025-06-13T09:20:00Z',
    tags: ['upi', 'remote-access', 'impersonation', 'google-ads'],
    complaintText: `I am Sunita Devi. On June 3, 2025, I was trying to contact my bank's customer care regarding a failed UPI transaction. I searched for "SBI customer care number" on Google and called the first number that appeared (+91-70001-22334).\n\nThe person who answered identified himself as "Rahul from SBI Customer Support." He asked me to download an app called "AnyDesk" for remote assistance. After installing it, he asked me to share the 9-digit code. He then asked me to open my PhonePe app and complete a "verification transaction" of ₹1.\n\nWithin minutes, multiple UPI transactions were initiated from my account:\n- ₹49,999 to 8899xxxx@ybl\n- ₹49,999 to 8899xxxx@ybl\n- ₹49,999 to scamhelp@axl  \n- ₹49,999 to scamhelp@axl\n- ₹47,004 to merchant.pay@oksbi\n- ₹40,000 to merchant.pay@oksbi\n\nTotal lost: ₹2,87,000. I immediately contacted my bank but was told the money had already been transferred.`,
    entities: [
      { id: 'ENT-010', type: 'Phone Number', value: '+91-70001-22334', label: 'Fake Customer Care Number', riskLevel: 'High', associatedCases: 12, firstSeen: '2025-03-01', lastSeen: '2025-06-05' },
      { id: 'ENT-011', type: 'UPI ID', value: '8899xxxx@ybl', label: 'Suspect UPI - YBL', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-04-15', lastSeen: '2025-06-03' },
      { id: 'ENT-012', type: 'UPI ID', value: 'scamhelp@axl', label: 'Suspect UPI - Axis', riskLevel: 'High', associatedCases: 5, firstSeen: '2025-05-01', lastSeen: '2025-06-03' },
      { id: 'ENT-013', type: 'UPI ID', value: 'merchant.pay@oksbi', label: 'Suspect Merchant UPI', riskLevel: 'High', associatedCases: 3, firstSeen: '2025-05-20', lastSeen: '2025-06-03' },
    ],
    evidence: [
      { id: 'EV-010', type: 'Screenshot', fileName: 'google_search_result.png', fileSize: '1.8 MB', uploadedAt: '2025-06-05T11:30:00Z', uploadedBy: 'Sunita Devi', description: 'Google search result showing fake customer care number' },
      { id: 'EV-011', type: 'Bank Statement', fileName: 'sbi_transactions_june.pdf', fileSize: '980 KB', uploadedAt: '2025-06-05T12:00:00Z', uploadedBy: 'SI Priya Sharma', description: 'Transaction history showing unauthorized debits' },
      { id: 'EV-012', type: 'Screenshot', fileName: 'anydesk_session.png', fileSize: '1.2 MB', uploadedAt: '2025-06-05T11:45:00Z', uploadedBy: 'Sunita Devi', description: 'AnyDesk session showing remote access log' },
    ],
    timeline: [
      { id: 'TL-020', time: '10:00 AM', date: '2025-06-03', title: 'Failed UPI Transaction', description: 'Original UPI transaction failure that prompted the call', type: 'action' },
      { id: 'TL-021', time: '10:15 AM', date: '2025-06-03', title: 'Google Search', description: 'Victim searched for bank customer care number', type: 'action' },
      { id: 'TL-022', time: '10:20 AM', date: '2025-06-03', title: 'Fraudulent Call', description: 'Victim called fake customer care number', type: 'contact' },
      { id: 'TL-023', time: '10:35 AM', date: '2025-06-03', title: 'Remote Access Granted', description: 'AnyDesk installed, remote access code shared', type: 'escalation' },
      { id: 'TL-024', time: '10:40 AM', date: '2025-06-03', title: 'Unauthorized Transactions', description: 'Six UPI transactions totaling ₹2,87,000 executed', type: 'transaction' },
      { id: 'TL-025', time: '11:00 AM', date: '2025-06-03', title: 'Bank Notified', description: 'Victim contacted SBI branch to report fraud', type: 'action' },
      { id: 'TL-026', time: '11:00 AM', date: '2025-06-05', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Mumbai', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-003',
    title: 'Phishing Attack via Fake Bank SMS',
    description: 'Victim received fake SMS claiming KYC expiry. Entered credentials on phishing website resulting in unauthorized access and fund transfer.',
    fraudCategory: 'Phishing',
    priority: 'Medium',
    status: 'Pending Review',
    victim: {
      name: 'Rakesh Malhotra',
      contact: '+91-88776-65544',
      email: 'rakesh.m@outlook.com',
      address: '78, MG Road, Pune, Maharashtra - 411001',
      age: 45,
      occupation: 'Business Owner',
    },
    assignedOfficer: officers[2],
    amountLost: 495000,
    createdAt: '2025-05-20T14:00:00Z',
    updatedAt: '2025-06-10T11:30:00Z',
    tags: ['phishing', 'sms', 'kyc-scam', 'banking'],
    complaintText: `I received an SMS on May 18, 2025 from sender ID "VM-HDFCBK" stating: "Dear Customer, your HDFC Bank account will be suspended. Please update your KYC immediately: https://hdfc-kyc-update.in/verify"\n\nBelieving it to be genuine, I clicked the link which opened a website identical to HDFC Bank's netbanking portal. I entered my customer ID, password, and OTP. After submission, the page showed an error.\n\nWithin 30 minutes, I received genuine HDFC Bank SMS alerts showing:\n- ₹99,999 transferred via IMPS\n- ₹99,999 transferred via IMPS\n- ₹99,999 transferred via IMPS\n- ₹99,999 transferred via IMPS\n- ₹95,004 transferred via IMPS\n\nTotal: ₹4,95,000 transferred to unknown accounts. I immediately called HDFC Bank and blocked my account.`,
    entities: [
      { id: 'ENT-020', type: 'Website', value: 'hdfc-kyc-update.in', label: 'Phishing Website', riskLevel: 'High', associatedCases: 15, firstSeen: '2025-05-10', lastSeen: '2025-05-20' },
      { id: 'ENT-021', type: 'Phone Number', value: 'VM-HDFCBK (Spoofed)', label: 'Spoofed Sender ID', riskLevel: 'High', associatedCases: 15, firstSeen: '2025-05-10', lastSeen: '2025-05-20' },
      { id: 'ENT-022', type: 'Email Address', value: 'support@hdfc-kyc-update.in', label: 'Phishing Domain Email', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-05-10', lastSeen: '2025-05-18' },
      { id: 'ENT-023', type: 'IP Address', value: '185.234.72.xx', label: 'Phishing Server IP', riskLevel: 'High', associatedCases: 20, firstSeen: '2025-04-01', lastSeen: '2025-05-20' },
    ],
    evidence: [
      { id: 'EV-020', type: 'Screenshot', fileName: 'phishing_sms.png', fileSize: '450 KB', uploadedAt: '2025-05-20T15:00:00Z', uploadedBy: 'Rakesh Malhotra', description: 'Screenshot of the phishing SMS received' },
      { id: 'EV-021', type: 'Screenshot', fileName: 'phishing_website.png', fileSize: '2.8 MB', uploadedAt: '2025-05-20T15:10:00Z', uploadedBy: 'Rakesh Malhotra', description: 'Screenshot of the phishing website mimicking HDFC Bank' },
      { id: 'EV-022', type: 'Bank Statement', fileName: 'hdfc_statement.pdf', fileSize: '1.5 MB', uploadedAt: '2025-05-21T09:00:00Z', uploadedBy: 'Inspector Vikram Singh', description: 'HDFC Bank statement showing unauthorized IMPS transfers' },
    ],
    timeline: [
      { id: 'TL-030', time: '02:30 PM', date: '2025-05-18', title: 'Phishing SMS Received', description: 'Fake KYC update SMS received from spoofed sender', type: 'contact' },
      { id: 'TL-031', time: '02:35 PM', date: '2025-05-18', title: 'Phishing Link Clicked', description: 'Victim clicked malicious link in SMS', type: 'action' },
      { id: 'TL-032', time: '02:40 PM', date: '2025-05-18', title: 'Credentials Entered', description: 'Customer ID, password, and OTP entered on fake portal', type: 'escalation' },
      { id: 'TL-033', time: '03:10 PM', date: '2025-05-18', title: 'Unauthorized Transfers', description: 'Five IMPS transactions totaling ₹4,95,000', type: 'transaction' },
      { id: 'TL-034', time: '03:30 PM', date: '2025-05-18', title: 'Account Blocked', description: 'Victim contacted HDFC helpline and blocked account', type: 'action' },
      { id: 'TL-035', time: '02:00 PM', date: '2025-05-20', title: 'FIR Filed', description: 'Complaint registered at Cyber Crime Division, Bangalore', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-004',
    title: 'Job Scam via LinkedIn Impersonation',
    description: 'Fraudsters created fake LinkedIn profiles impersonating HR personnel of reputed MNC. Victims charged for "processing fees" and "training materials".',
    fraudCategory: 'Job Scam',
    priority: 'High',
    status: 'Open',
    victim: {
      name: 'Neha Agarwal',
      contact: '+91-77665-54433',
      email: 'neha.agarwal@gmail.com',
      address: '23, Indiranagar, Bangalore, Karnataka - 560038',
      age: 26,
      occupation: 'Recent Graduate',
    },
    assignedOfficer: officers[2],
    amountLost: 145000,
    createdAt: '2025-06-10T08:00:00Z',
    updatedAt: '2025-06-15T14:00:00Z',
    tags: ['linkedin', 'impersonation', 'job-fraud', 'fake-offer'],
    complaintText: `I am Neha Agarwal, a 2024 computer science graduate. On May 25, 2025, I received a LinkedIn message from a profile named "Sanjay Mehta - HR Director, Infosys" offering a position of "Junior Software Developer" with CTC of ₹8.5 LPA.\n\nThe LinkedIn profile appeared genuine with 500+ connections and regular posts. After an interview conducted via Google Meet, I received an offer letter via email (hr.recruitment@infosys-careers.com) that looked very professional.\n\nI was then asked to pay various fees:\n- ₹25,000 for "background verification" via UPI (hrinfosys@ybl)\n- ₹35,000 for "training material kit" via bank transfer\n- ₹45,000 for "laptop security deposit" via UPI (infosys.hr2025@oksbi)\n- ₹40,000 for "onboarding processing" via UPI\n\nWhen I questioned the joining date delay, the profile blocked me and the email stopped responding.`,
    entities: [
      { id: 'ENT-030', type: 'Social Media', value: 'linkedin.com/in/sanjay-mehta-hr-infosys', label: 'Fake LinkedIn Profile', riskLevel: 'High', associatedCases: 7, firstSeen: '2025-04-01', lastSeen: '2025-06-10' },
      { id: 'ENT-031', type: 'Email Address', value: 'hr.recruitment@infosys-careers.com', label: 'Fraudulent Email', riskLevel: 'High', associatedCases: 7, firstSeen: '2025-04-15', lastSeen: '2025-06-08' },
      { id: 'ENT-032', type: 'UPI ID', value: 'hrinfosys@ybl', label: 'Suspect UPI 1', riskLevel: 'High', associatedCases: 4, firstSeen: '2025-05-01', lastSeen: '2025-06-05' },
      { id: 'ENT-033', type: 'UPI ID', value: 'infosys.hr2025@oksbi', label: 'Suspect UPI 2', riskLevel: 'High', associatedCases: 3, firstSeen: '2025-05-10', lastSeen: '2025-06-05' },
      { id: 'ENT-034', type: 'Website', value: 'infosys-careers.com', label: 'Fraudulent Domain', riskLevel: 'High', associatedCases: 7, firstSeen: '2025-03-15', lastSeen: '2025-06-10' },
    ],
    evidence: [
      { id: 'EV-030', type: 'Screenshot', fileName: 'linkedin_profile_fake.png', fileSize: '2.1 MB', uploadedAt: '2025-06-10T08:30:00Z', uploadedBy: 'Neha Agarwal', description: 'Screenshot of the fake LinkedIn profile' },
      { id: 'EV-031', type: 'Email Thread', fileName: 'offer_letter_email.eml', fileSize: '3.4 MB', uploadedAt: '2025-06-10T08:45:00Z', uploadedBy: 'Neha Agarwal', description: 'Email thread with fake offer letter attachment' },
      { id: 'EV-032', type: 'Screenshot', fileName: 'upi_payments.png', fileSize: '1.7 MB', uploadedAt: '2025-06-10T09:00:00Z', uploadedBy: 'Neha Agarwal', description: 'Screenshots of UPI payment confirmations' },
    ],
    timeline: [
      { id: 'TL-040', time: '11:00 AM', date: '2025-05-25', title: 'LinkedIn Message', description: 'Received job offer message from fake HR profile', type: 'contact' },
      { id: 'TL-041', time: '03:00 PM', date: '2025-05-27', title: 'Google Meet Interview', description: 'Conducted interview via Google Meet with impostor', type: 'communication' },
      { id: 'TL-042', time: '10:00 AM', date: '2025-05-28', title: 'Offer Letter Received', description: 'Professional-looking fake offer letter received via email', type: 'communication' },
      { id: 'TL-043', time: '02:00 PM', date: '2025-05-29', title: 'First Payment', description: '₹25,000 paid for "background verification"', type: 'transaction' },
      { id: 'TL-044', time: '11:00 AM', date: '2025-06-01', title: 'Second Payment', description: '₹35,000 paid for "training materials"', type: 'transaction' },
      { id: 'TL-045', time: '04:00 PM', date: '2025-06-03', title: 'Third Payment', description: '₹45,000 paid for "laptop deposit"', type: 'transaction' },
      { id: 'TL-046', time: '09:00 AM', date: '2025-06-05', title: 'Fourth Payment', description: '₹40,000 paid for "onboarding"', type: 'transaction' },
      { id: 'TL-047', time: '10:00 AM', date: '2025-06-09', title: 'Contact Lost', description: 'LinkedIn profile blocked victim, email unresponsive', type: 'escalation' },
    ],
  },
  {
    id: 'CASE-2025-005',
    title: 'Loan App Fraud — Predatory Lending & Extortion',
    description: 'Victim downloaded fake loan app from Play Store. After taking small loan, subjected to harassment, morphed photo threats, and extortion for inflated amounts.',
    fraudCategory: 'Loan App Fraud',
    priority: 'Critical',
    status: 'Escalated',
    victim: {
      name: 'Deepak Sharma',
      contact: '+91-66554-43322',
      email: 'deepak.sharma@gmail.com',
      address: '56, Old City, Lucknow, UP - 226001',
      age: 29,
      occupation: 'Small Business Owner',
    },
    assignedOfficer: officers[3],
    amountLost: 380000,
    createdAt: '2025-05-28T07:00:00Z',
    updatedAt: '2025-06-14T18:00:00Z',
    tags: ['loan-app', 'extortion', 'morphed-photos', 'play-store', 'harassment'],
    complaintText: `I downloaded a loan app called "QuickCash Pro" from Google Play Store on May 10, 2025. The app offered instant personal loans up to ₹50,000. During registration, the app requested access to my contacts, gallery, and SMS — which I granted.\n\nI took a loan of ₹15,000 with a stated interest rate of 12% per annum. However, I only received ₹11,500 after "processing fees." The actual repayment demanded after 7 days was ₹22,500.\n\nWhen I expressed inability to pay, the harassment began:\n- Threatening calls from multiple numbers\n- Messages sent to ALL my contacts claiming I was a defaulter\n- My profile photos were morphed with obscene images and sent to my contacts\n- They threatened to send these images to my employer\n\nI was forced to pay ₹3,80,000 across multiple transactions over 3 weeks. Despite payments, the harassment continued with new demands.`,
    entities: [
      { id: 'ENT-040', type: 'Phone Number', value: '+91-63001-44556', label: 'Harassment Call 1', riskLevel: 'High', associatedCases: 25, firstSeen: '2025-03-01', lastSeen: '2025-06-14' },
      { id: 'ENT-041', type: 'Phone Number', value: '+91-63002-78899', label: 'Harassment Call 2', riskLevel: 'High', associatedCases: 18, firstSeen: '2025-03-15', lastSeen: '2025-06-10' },
      { id: 'ENT-042', type: 'UPI ID', value: 'quickcash.collect@ybl', label: 'Loan App UPI', riskLevel: 'High', associatedCases: 30, firstSeen: '2025-02-01', lastSeen: '2025-06-14' },
      { id: 'ENT-043', type: 'Website', value: 'quickcashpro.app', label: 'Loan App Website', riskLevel: 'High', associatedCases: 30, firstSeen: '2025-01-15', lastSeen: '2025-06-14' },
    ],
    evidence: [
      { id: 'EV-040', type: 'Screenshot', fileName: 'loan_app_playstore.png', fileSize: '1.5 MB', uploadedAt: '2025-05-28T07:30:00Z', uploadedBy: 'Deepak Sharma', description: 'Google Play Store listing of QuickCash Pro' },
      { id: 'EV-041', type: 'Chat Export', fileName: 'whatsapp_threats.html', fileSize: '5.2 MB', uploadedAt: '2025-05-28T08:00:00Z', uploadedBy: 'Deepak Sharma', description: 'WhatsApp messages containing threats and harassment' },
      { id: 'EV-042', type: 'Screenshot', fileName: 'morphed_images_threats.png', fileSize: '890 KB', uploadedAt: '2025-05-28T08:15:00Z', uploadedBy: 'Deepak Sharma', description: 'Screenshots of threats to circulate morphed images' },
      { id: 'EV-043', type: 'Transaction Log', fileName: 'upi_payment_history.pdf', fileSize: '2.1 MB', uploadedAt: '2025-05-29T10:00:00Z', uploadedBy: 'ASI Meera Patel', description: 'Complete UPI transaction history of extortion payments' },
      { id: 'EV-044', type: 'Call Recording', fileName: 'threatening_call_recording.mp3', fileSize: '8.5 MB', uploadedAt: '2025-05-30T14:00:00Z', uploadedBy: 'Deepak Sharma', description: 'Recording of threatening phone call from fraudsters' },
    ],
    timeline: [
      { id: 'TL-050', time: '09:00 AM', date: '2025-05-10', title: 'App Downloaded', description: 'QuickCash Pro downloaded from Google Play Store', type: 'action' },
      { id: 'TL-051', time: '09:15 AM', date: '2025-05-10', title: 'Permissions Granted', description: 'Contacts, gallery, and SMS access granted to app', type: 'escalation' },
      { id: 'TL-052', time: '09:30 AM', date: '2025-05-10', title: 'Loan Disbursed', description: '₹11,500 received (₹15,000 loan minus processing)', type: 'transaction' },
      { id: 'TL-053', time: '08:00 AM', date: '2025-05-17', title: 'Repayment Demand', description: '₹22,500 demanded as repayment for ₹15,000 loan', type: 'contact' },
      { id: 'TL-054', time: '10:00 AM', date: '2025-05-18', title: 'Harassment Begins', description: 'Threatening calls and messages to contacts started', type: 'escalation' },
      { id: 'TL-055', time: '02:00 PM', date: '2025-05-20', title: 'Morphed Photos', description: 'Morphed obscene images created and distributed', type: 'escalation' },
      { id: 'TL-056', time: '07:00 AM', date: '2025-05-28', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Ahmedabad', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-006',
    title: 'Sextortion via Instagram — Video Call Recording',
    description: 'Victim befriended on Instagram, lured into compromising video call which was secretly recorded. Extorted with threats of sharing the recording.',
    fraudCategory: 'Sextortion',
    priority: 'Critical',
    status: 'Under Investigation',
    victim: {
      name: 'Confidential (V-006)',
      contact: '+91-XXXXX-XX006',
      email: 'confidential@case006',
      address: 'Confidential, Chennai, Tamil Nadu',
      age: 31,
      occupation: 'IT Professional',
    },
    assignedOfficer: officers[5],
    amountLost: 520000,
    createdAt: '2025-06-08T06:00:00Z',
    updatedAt: '2025-06-15T20:00:00Z',
    tags: ['sextortion', 'instagram', 'video-call', 'blackmail', 'sensitive'],
    complaintText: `[CONFIDENTIAL COMPLAINT - RESTRICTED ACCESS]\n\nThe victim received a follow request on Instagram from a profile appearing to be an attractive individual. After a week of casual conversation, the suspect initiated a video call on WhatsApp during which the suspect engaged in provocative behavior, encouraging the victim to reciprocate.\n\nThe video call was secretly recorded. Immediately after the call, the victim received screenshots and video clips with a demand for ₹5,00,000 to prevent distribution to the victim's social media contacts and professional network.\n\nPayments made under duress:\n- ₹1,00,000 via UPI on June 5\n- ₹1,50,000 via UPI on June 6\n- ₹1,20,000 via bank transfer on June 7\n- ₹1,50,000 via UPI on June 8\n\nDespite total payments of ₹5,20,000, further demands continued. Case involves sensitive personal content and requires confidential handling.`,
    entities: [
      { id: 'ENT-050', type: 'Social Media', value: '@priya_lifestyle_2025', label: 'Fake Instagram Profile', riskLevel: 'High', associatedCases: 9, firstSeen: '2025-04-15', lastSeen: '2025-06-08' },
      { id: 'ENT-051', type: 'Phone Number', value: '+91-81001-99887', label: 'Suspect WhatsApp Number', riskLevel: 'High', associatedCases: 6, firstSeen: '2025-05-01', lastSeen: '2025-06-08' },
      { id: 'ENT-052', type: 'UPI ID', value: 'payfast.help@ybl', label: 'Extortion Payment UPI', riskLevel: 'High', associatedCases: 11, firstSeen: '2025-03-01', lastSeen: '2025-06-08' },
      { id: 'ENT-053', type: 'Bank Account', value: 'A/C 6789xxxx4523 (ICICI)', label: 'Suspect Bank Account', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-02-15', lastSeen: '2025-06-07' },
    ],
    evidence: [
      { id: 'EV-050', type: 'Screenshot', fileName: 'instagram_profile_suspect.png', fileSize: '1.9 MB', uploadedAt: '2025-06-08T07:00:00Z', uploadedBy: 'SI Kavitha Nair', description: 'Screenshot of suspect Instagram profile' },
      { id: 'EV-051', type: 'Chat Export', fileName: 'whatsapp_extortion_chat.html', fileSize: '4.7 MB', uploadedAt: '2025-06-08T07:30:00Z', uploadedBy: 'SI Kavitha Nair', description: 'WhatsApp chat containing extortion messages' },
      { id: 'EV-052', type: 'Transaction Log', fileName: 'payment_trail.pdf', fileSize: '1.8 MB', uploadedAt: '2025-06-09T10:00:00Z', uploadedBy: 'SI Kavitha Nair', description: 'Transaction records of extortion payments' },
    ],
    timeline: [
      { id: 'TL-060', time: '08:00 PM', date: '2025-05-28', title: 'Instagram Connection', description: 'Follow request received from suspect profile', type: 'contact' },
      { id: 'TL-061', time: '10:30 PM', date: '2025-06-04', title: 'Video Call Trap', description: 'Compromising video call secretly recorded', type: 'escalation' },
      { id: 'TL-062', time: '11:00 PM', date: '2025-06-04', title: 'Extortion Demand', description: '₹5,00,000 demanded with threat of distribution', type: 'escalation' },
      { id: 'TL-063', time: '09:00 AM', date: '2025-06-05', title: 'First Payment', description: '₹1,00,000 paid via UPI under duress', type: 'transaction' },
      { id: 'TL-064', time: '11:00 AM', date: '2025-06-06', title: 'Second Payment', description: '₹1,50,000 paid via UPI', type: 'transaction' },
      { id: 'TL-065', time: '02:00 PM', date: '2025-06-07', title: 'Third Payment', description: '₹1,20,000 via bank transfer', type: 'transaction' },
      { id: 'TL-066', time: '06:00 AM', date: '2025-06-08', title: 'FIR Filed', description: 'Confidential complaint filed with Cyber Crime Division, Chennai', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-007',
    title: 'Online Shopping Fraud — Fake E-commerce Website',
    description: 'Victim purchased electronics from a counterfeit e-commerce site offering heavy discounts. Products never delivered, payment non-refundable.',
    fraudCategory: 'Online Shopping Fraud',
    priority: 'Low',
    status: 'Closed',
    victim: {
      name: 'Pooja Kumari',
      contact: '+91-93345-67890',
      email: 'pooja.k@gmail.com',
      address: '34, Salt Lake, Kolkata, WB - 700064',
      age: 38,
      occupation: 'Teacher',
    },
    assignedOfficer: officers[4],
    amountLost: 32000,
    createdAt: '2025-04-15T10:00:00Z',
    updatedAt: '2025-05-30T16:00:00Z',
    closedAt: '2025-05-30T16:00:00Z',
    tags: ['ecommerce', 'fake-website', 'non-delivery'],
    complaintText: `On April 10, 2025, I found a website "www.megadealsindia.com" through a Facebook advertisement offering Samsung Galaxy S24 Ultra at ₹32,000 (70% discount). The website looked professional with product reviews and SSL certificate.\n\nI placed an order and paid ₹32,000 via UPI (megadeals@paytm). I received an order confirmation email with a tracking number that didn't work on any courier service website.\n\nAfter 10 days of no delivery, I tried contacting their customer support but the phone number was switched off and emails bounced. The website was taken down within a week of my complaint.`,
    entities: [
      { id: 'ENT-060', type: 'Website', value: 'megadealsindia.com', label: 'Fake E-commerce Site', riskLevel: 'High', associatedCases: 45, firstSeen: '2025-03-01', lastSeen: '2025-04-20' },
      { id: 'ENT-061', type: 'UPI ID', value: 'megadeals@paytm', label: 'Fraudulent Payment UPI', riskLevel: 'High', associatedCases: 40, firstSeen: '2025-03-05', lastSeen: '2025-04-15' },
      { id: 'ENT-062', type: 'Email Address', value: 'support@megadealsindia.com', label: 'Fake Support Email', riskLevel: 'Medium', associatedCases: 45, firstSeen: '2025-03-01', lastSeen: '2025-04-18' },
    ],
    evidence: [
      { id: 'EV-060', type: 'Screenshot', fileName: 'fake_website_homepage.png', fileSize: '3.2 MB', uploadedAt: '2025-04-15T10:30:00Z', uploadedBy: 'Pooja Kumari', description: 'Screenshot of the fake e-commerce website' },
      { id: 'EV-061', type: 'Screenshot', fileName: 'payment_confirmation.png', fileSize: '1.1 MB', uploadedAt: '2025-04-15T10:45:00Z', uploadedBy: 'Pooja Kumari', description: 'UPI payment confirmation screenshot' },
      { id: 'EV-062', type: 'Email Thread', fileName: 'order_confirmation.eml', fileSize: '520 KB', uploadedAt: '2025-04-15T11:00:00Z', uploadedBy: 'Pooja Kumari', description: 'Order confirmation email with fake tracking number' },
    ],
    timeline: [
      { id: 'TL-070', time: '07:00 PM', date: '2025-04-10', title: 'Facebook Ad Seen', description: 'Victim saw targeted Facebook ad for discounted electronics', type: 'contact' },
      { id: 'TL-071', time: '07:30 PM', date: '2025-04-10', title: 'Order Placed', description: '₹32,000 paid via UPI for Samsung phone', type: 'transaction' },
      { id: 'TL-072', time: '07:35 PM', date: '2025-04-10', title: 'Confirmation Received', description: 'Order confirmation email with fake tracking number', type: 'communication' },
      { id: 'TL-073', time: '10:00 AM', date: '2025-04-20', title: 'Non-delivery Noticed', description: 'No delivery after 10 days, tracking number invalid', type: 'action' },
      { id: 'TL-074', time: '10:00 AM', date: '2025-04-15', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Hyderabad', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-008',
    title: 'Identity Theft — Aadhaar Misuse for Loan Application',
    description: 'Victim discovered unauthorized personal loan taken using stolen Aadhaar and PAN details. Multiple loans across different NBFCs.',
    fraudCategory: 'Identity Theft',
    priority: 'High',
    status: 'Under Investigation',
    victim: {
      name: 'Suresh Iyer',
      contact: '+91-84432-11009',
      email: 'suresh.iyer@protonmail.com',
      address: '89, T Nagar, Chennai, TN - 600017',
      age: 42,
      occupation: 'Chartered Accountant',
    },
    assignedOfficer: officers[5],
    amountLost: 750000,
    createdAt: '2025-06-12T09:00:00Z',
    updatedAt: '2025-06-15T13:00:00Z',
    tags: ['identity-theft', 'aadhaar', 'pan-misuse', 'loan-fraud', 'nbfc'],
    complaintText: `I am Suresh Iyer, a Chartered Accountant. On June 10, 2025, I received an SMS from an NBFC stating that my EMI of ₹12,500 was due. I have never taken any loan from this institution.\n\nUpon investigation, I discovered that three personal loans had been taken in my name using my Aadhaar and PAN details:\n1. ₹2,50,000 from FlexiLoan Finance on May 1, 2025\n2. ₹3,00,000 from QuickMoney NBFC on May 10, 2025  \n3. ₹2,00,000 from EasyCredit Finance on May 20, 2025\n\nThe loan amounts were disbursed to bank accounts I do not own. My CIBIL score has dropped from 810 to 650 due to EMI defaults on these fraudulent loans.\n\nI suspect my Aadhaar and PAN details may have been compromised from a data breach or from photocopies submitted at a previous employer.`,
    entities: [
      { id: 'ENT-070', type: 'Phone Number', value: '+91-72001-33445', label: 'Linked to Fraud Loans', riskLevel: 'High', associatedCases: 3, firstSeen: '2025-05-01', lastSeen: '2025-06-10' },
      { id: 'ENT-071', type: 'Bank Account', value: 'A/C 1122xxxx9988 (Axis)', label: 'Loan Disbursement Account 1', riskLevel: 'High', associatedCases: 2, firstSeen: '2025-05-01', lastSeen: '2025-05-10' },
      { id: 'ENT-072', type: 'Bank Account', value: 'A/C 3344xxxx5566 (ICICI)', label: 'Loan Disbursement Account 2', riskLevel: 'High', associatedCases: 2, firstSeen: '2025-05-10', lastSeen: '2025-05-20' },
      { id: 'ENT-073', type: 'Email Address', value: 'suresh.iyer.verify@outlook.com', label: 'Fraudulent Email', riskLevel: 'High', associatedCases: 3, firstSeen: '2025-04-25', lastSeen: '2025-05-20' },
    ],
    evidence: [
      { id: 'EV-070', type: 'Complaint PDF', fileName: 'nbfc_loan_documents.pdf', fileSize: '5.4 MB', uploadedAt: '2025-06-12T09:30:00Z', uploadedBy: 'Suresh Iyer', description: 'Loan documents obtained from NBFCs showing fraudulent applications' },
      { id: 'EV-071', type: 'Screenshot', fileName: 'cibil_report.png', fileSize: '2.3 MB', uploadedAt: '2025-06-12T10:00:00Z', uploadedBy: 'Suresh Iyer', description: 'CIBIL report showing unauthorized loan inquiries' },
    ],
    timeline: [
      { id: 'TL-080', time: '08:00 AM', date: '2025-06-10', title: 'EMI SMS Received', description: 'SMS received from unknown NBFC about EMI due', type: 'contact' },
      { id: 'TL-081', time: '10:00 AM', date: '2025-06-10', title: 'CIBIL Check', description: 'Victim checked CIBIL report and found 3 unauthorized loans', type: 'evidence' },
      { id: 'TL-082', time: '02:00 PM', date: '2025-06-11', title: 'NBFC Contacted', description: 'All three NBFCs contacted for loan documents', type: 'action' },
      { id: 'TL-083', time: '09:00 AM', date: '2025-06-12', title: 'FIR Filed', description: 'Complaint filed with Cyber Crime Division, Chennai', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-009',
    title: 'UPI Fraud via QR Code Scam at OLX Sale',
    description: 'Victim tried selling furniture on OLX. Buyer sent "payment QR code" which was actually a payment request. Victim scanned and lost money.',
    fraudCategory: 'UPI Fraud',
    priority: 'Medium',
    status: 'Resolved',
    victim: {
      name: 'Arun Gupta',
      contact: '+91-95567-88990',
      email: 'arun.gupta@gmail.com',
      address: '11, Civil Lines, Lucknow, UP - 226001',
      age: 35,
      occupation: 'Government Employee',
    },
    assignedOfficer: officers[0],
    amountLost: 85000,
    createdAt: '2025-05-10T15:00:00Z',
    updatedAt: '2025-06-05T12:00:00Z',
    closedAt: '2025-06-05T12:00:00Z',
    tags: ['olx', 'qr-code', 'upi-scam', 'social-engineering'],
    complaintText: `I listed my old sofa set for sale on OLX at ₹15,000. A buyer named "Captain Ravi Shankar" contacted me claiming to be an Army officer posted at a nearby cantonment. He agreed to my asking price without negotiation.\n\nHe said he would send payment via Google Pay and shared a QR code saying "Scan this to receive ₹15,000." Being unfamiliar with QR code mechanics, I scanned it and entered my UPI PIN. Instead of receiving money, ₹15,000 was deducted.\n\nHe then called back saying there was a "server error" and sent another QR code for "refund processing." I scanned it again and lost another ₹20,000. This happened three more times (₹20,000 + ₹15,000 + ₹15,000) before I realized the scam. Total loss: ₹85,000.`,
    entities: [
      { id: 'ENT-080', type: 'Phone Number', value: '+91-89001-22334', label: 'Suspect Phone (Army Impostor)', riskLevel: 'High', associatedCases: 14, firstSeen: '2025-03-01', lastSeen: '2025-05-10' },
      { id: 'ENT-081', type: 'UPI ID', value: 'capt.ravi2025@okaxis', label: 'Suspect UPI', riskLevel: 'High', associatedCases: 10, firstSeen: '2025-03-15', lastSeen: '2025-05-10' },
    ],
    evidence: [
      { id: 'EV-080', type: 'Screenshot', fileName: 'olx_listing_chat.png', fileSize: '2.0 MB', uploadedAt: '2025-05-10T15:30:00Z', uploadedBy: 'Arun Gupta', description: 'OLX chat with the fraudulent buyer' },
      { id: 'EV-081', type: 'Screenshot', fileName: 'gpay_transactions.png', fileSize: '1.3 MB', uploadedAt: '2025-05-10T16:00:00Z', uploadedBy: 'Arun Gupta', description: 'Google Pay transaction history showing multiple debits' },
    ],
    timeline: [
      { id: 'TL-090', time: '01:00 PM', date: '2025-05-10', title: 'OLX Contact', description: 'Buyer contacted via OLX chat expressing interest', type: 'contact' },
      { id: 'TL-091', time: '01:30 PM', date: '2025-05-10', title: 'First QR Scan', description: 'Scanned "payment" QR code, ₹15,000 debited', type: 'transaction' },
      { id: 'TL-092', time: '01:45 PM', date: '2025-05-10', title: 'Repeated Scans', description: 'Multiple QR codes scanned for "refund", ₹70,000 more debited', type: 'transaction' },
      { id: 'TL-093', time: '03:00 PM', date: '2025-05-10', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Delhi', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-010',
    title: 'Investment Scam — Fake Stock Trading App',
    description: 'Organized fraud ring operating fake stock trading application with fabricated P&L statements. Multiple victims across Maharashtra.',
    fraudCategory: 'Investment Scam',
    priority: 'Critical',
    status: 'Under Investigation',
    victim: {
      name: 'Dr. Anand Joshi',
      contact: '+91-98234-56789',
      email: 'dr.joshi@gmail.com',
      address: '67, Kothrud, Pune, Maharashtra - 411038',
      age: 55,
      occupation: 'Doctor (Physician)',
    },
    assignedOfficer: officers[1],
    amountLost: 3200000,
    createdAt: '2025-06-14T10:00:00Z',
    updatedAt: '2025-06-15T22:00:00Z',
    tags: ['stock-trading', 'fake-app', 'organized-crime', 'multi-victim', 'high-value'],
    complaintText: `I am Dr. Anand Joshi. I was approached via WhatsApp by someone claiming to be "Anil Ambani's private investment advisor." They added me to a WhatsApp group called "Elite Investors Club" with 200+ members who regularly posted screenshots of their trading profits.\n\nI was directed to download a trading app called "WealthMax Pro" (not on Play Store, APK shared via WhatsApp). The app showed real market data but allowed me to trade with guaranteed profits. My initial investment of ₹1,00,000 showed returns of ₹3,50,000 within a week.\n\nOver the next month, I invested:\n- ₹5,00,000 on May 20\n- ₹10,00,000 on May 25\n- ₹8,00,000 on June 1\n- ₹9,00,000 on June 5\n\nMy app showed total portfolio value of ₹78,00,000. When I tried to withdraw, I was asked to pay "capital gains tax" of ₹15,60,000 upfront. I refused and tried to contact the "advisor" who blocked me. The app stopped working the next day.`,
    entities: [
      { id: 'ENT-090', type: 'Phone Number', value: '+91-75001-88776', label: 'Fake Investment Advisor', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-04-01', lastSeen: '2025-06-10' },
      { id: 'ENT-091', type: 'Website', value: 'wealthmaxpro.co.in', label: 'Fake Trading App Domain', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-03-15', lastSeen: '2025-06-12' },
      { id: 'ENT-092', type: 'UPI ID', value: 'wealth.invest@kotak', label: 'Investment Collection UPI', riskLevel: 'High', associatedCases: 8, firstSeen: '2025-04-10', lastSeen: '2025-06-05' },
      { id: 'ENT-093', type: 'Bank Account', value: 'A/C 8899xxxx1100 (Kotak)', label: 'Primary Collection Account', riskLevel: 'High', associatedCases: 6, firstSeen: '2025-04-01', lastSeen: '2025-06-05' },
      { id: 'ENT-094', type: 'Telegram Handle', value: '@wealthmax_support', label: 'Support Telegram', riskLevel: 'High', associatedCases: 5, firstSeen: '2025-04-15', lastSeen: '2025-06-10' },
    ],
    evidence: [
      { id: 'EV-090', type: 'Screenshot', fileName: 'whatsapp_group.png', fileSize: '2.5 MB', uploadedAt: '2025-06-14T10:30:00Z', uploadedBy: 'Dr. Anand Joshi', description: 'WhatsApp group "Elite Investors Club" screenshot' },
      { id: 'EV-091', type: 'Screenshot', fileName: 'fake_app_portfolio.png', fileSize: '3.8 MB', uploadedAt: '2025-06-14T10:45:00Z', uploadedBy: 'Dr. Anand Joshi', description: 'WealthMax Pro app showing fabricated portfolio' },
      { id: 'EV-092', type: 'Bank Statement', fileName: 'kotak_statement.pdf', fileSize: '2.1 MB', uploadedAt: '2025-06-14T11:30:00Z', uploadedBy: 'SI Priya Sharma', description: 'Bank statement showing investment transfers' },
      { id: 'EV-093', type: 'Chat Export', fileName: 'whatsapp_advisor_chat.html', fileSize: '7.2 MB', uploadedAt: '2025-06-14T12:00:00Z', uploadedBy: 'Dr. Anand Joshi', description: 'Complete WhatsApp conversation with fake advisor' },
    ],
    timeline: [
      { id: 'TL-100', time: '11:00 AM', date: '2025-05-12', title: 'WhatsApp Contact', description: 'Approached by "investment advisor" via WhatsApp', type: 'contact' },
      { id: 'TL-101', time: '03:00 PM', date: '2025-05-14', title: 'App Installed', description: 'Downloaded fake trading app from shared APK', type: 'action' },
      { id: 'TL-102', time: '10:00 AM', date: '2025-05-15', title: 'Initial Investment', description: '₹1,00,000 invested, showed ₹3,50,000 returns', type: 'transaction' },
      { id: 'TL-103', time: '11:00 AM', date: '2025-06-05', title: 'Last Investment', description: 'Final ₹9,00,000 transferred', type: 'transaction' },
      { id: 'TL-104', time: '02:00 PM', date: '2025-06-10', title: 'Withdrawal Blocked', description: 'Asked to pay "capital gains tax" for withdrawal', type: 'escalation' },
      { id: 'TL-105', time: '10:00 AM', date: '2025-06-14', title: 'FIR Filed', description: 'Complaint registered at Cyber Crime Cell, Mumbai', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-011',
    title: 'Phishing — Fake Income Tax Refund Email',
    description: 'Victim received sophisticated phishing email mimicking IT Department. Entered banking details on cloned website resulting in unauthorized transactions.',
    fraudCategory: 'Phishing',
    priority: 'Medium',
    status: 'Closed',
    victim: {
      name: 'Kavita Menon',
      contact: '+91-91122-33445',
      email: 'kavita.menon@gmail.com',
      address: '45, Marine Drive, Kochi, Kerala - 682001',
      age: 48,
      occupation: 'College Professor',
    },
    assignedOfficer: officers[4],
    amountLost: 198000,
    createdAt: '2025-04-28T09:00:00Z',
    updatedAt: '2025-05-25T14:00:00Z',
    closedAt: '2025-05-25T14:00:00Z',
    tags: ['phishing', 'income-tax', 'email', 'refund-scam'],
    complaintText: `On April 25, 2025, I received an email from "refunds@incometax-gov.in" claiming I was eligible for an income tax refund of ₹45,000. The email looked official with the Income Tax Department logo and formatting.\n\nI clicked the link which redirected to a website that looked identical to the Income Tax e-filing portal. I entered my PAN, Aadhaar, bank account number, IFSC code, and net banking credentials for "verification."\n\nWithin 2 hours, ₹1,98,000 was transferred from my bank account in three NEFT transactions to unknown accounts.`,
    entities: [
      { id: 'ENT-100', type: 'Email Address', value: 'refunds@incometax-gov.in', label: 'Phishing Email', riskLevel: 'High', associatedCases: 50, firstSeen: '2025-03-01', lastSeen: '2025-04-28' },
      { id: 'ENT-101', type: 'Website', value: 'incometax-gov.in', label: 'Phishing Domain', riskLevel: 'High', associatedCases: 50, firstSeen: '2025-02-15', lastSeen: '2025-04-30' },
    ],
    evidence: [
      { id: 'EV-100', type: 'Email Thread', fileName: 'phishing_email.eml', fileSize: '1.8 MB', uploadedAt: '2025-04-28T09:30:00Z', uploadedBy: 'Kavita Menon', description: 'Original phishing email with headers' },
      { id: 'EV-101', type: 'Bank Statement', fileName: 'sbi_statement_apr.pdf', fileSize: '1.2 MB', uploadedAt: '2025-04-28T10:00:00Z', uploadedBy: 'Kavita Menon', description: 'Bank statement showing unauthorized NEFT transfers' },
    ],
    timeline: [
      { id: 'TL-110', time: '09:00 AM', date: '2025-04-25', title: 'Phishing Email', description: 'Fake IT Department refund email received', type: 'contact' },
      { id: 'TL-111', time: '09:15 AM', date: '2025-04-25', title: 'Credentials Entered', description: 'Banking details entered on cloned website', type: 'escalation' },
      { id: 'TL-112', time: '11:00 AM', date: '2025-04-25', title: 'Unauthorized Transfers', description: '₹1,98,000 transferred via NEFT', type: 'transaction' },
      { id: 'TL-113', time: '09:00 AM', date: '2025-04-28', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Hyderabad', type: 'action' },
    ],
  },
  {
    id: 'CASE-2025-012',
    title: 'Job Scam — Fake Work-From-Home Task Fraud',
    description: 'Victim recruited for fake data entry work-from-home job. Required to make "task deposits" to unlock higher-paying tasks, classic advance fee fraud.',
    fraudCategory: 'Job Scam',
    priority: 'Medium',
    status: 'Open',
    victim: {
      name: 'Fatima Sheikh',
      contact: '+91-82233-44556',
      email: 'fatima.sheikh@gmail.com',
      address: '22, Bandra West, Mumbai, Maharashtra - 400050',
      age: 24,
      occupation: 'Unemployed Graduate',
    },
    assignedOfficer: officers[1],
    amountLost: 167000,
    createdAt: '2025-06-15T08:00:00Z',
    updatedAt: '2025-06-15T16:00:00Z',
    tags: ['work-from-home', 'task-fraud', 'telegram', 'advance-fee'],
    complaintText: `I saw an Instagram ad for "Easy Online Earning - ₹2000-5000 daily" and joined a Telegram group. A "task coordinator" named "Priya Ma'am" explained the work:\n\n1. Complete simple tasks (product reviews, ratings) on a website\n2. Get paid per task completed\n3. Unlock higher-paying tasks by making deposits\n\nI completed initial tasks worth ₹500 and received payment, building trust. Then I was asked to make a "task deposit" of ₹5,000 to access ₹50/task reviews. The cycle continued:\n\n- ₹5,000 deposit → Earned ₹2,000 → Withdrawal successful\n- ₹15,000 deposit → Earned ₹7,000 → Withdrawal successful  \n- ₹50,000 deposit → "System error, deposit ₹47,000 more to fix"\n- ₹47,000 deposit → "Account frozen, deposit ₹50,000 to unfreeze"\n- ₹50,000 deposit → All communication ceased\n\nTotal invested: ₹1,67,000 (received back only ₹9,000 in early withdrawals).`,
    entities: [
      { id: 'ENT-110', type: 'Telegram Handle', value: '@easy_earning_tasks', label: 'Fraud Telegram Channel', riskLevel: 'High', associatedCases: 35, firstSeen: '2025-04-01', lastSeen: '2025-06-15' },
      { id: 'ENT-111', type: 'UPI ID', value: 'task.deposit@ybl', label: 'Task Deposit UPI', riskLevel: 'High', associatedCases: 20, firstSeen: '2025-04-10', lastSeen: '2025-06-14' },
      { id: 'ENT-112', type: 'Website', value: 'taskearningpro.com', label: 'Fake Task Platform', riskLevel: 'High', associatedCases: 35, firstSeen: '2025-03-15', lastSeen: '2025-06-15' },
      { id: 'ENT-113', type: 'Phone Number', value: '+91-62001-55667', label: 'Coordinator Number', riskLevel: 'High', associatedCases: 12, firstSeen: '2025-05-01', lastSeen: '2025-06-14' },
    ],
    evidence: [
      { id: 'EV-110', type: 'Screenshot', fileName: 'instagram_ad.png', fileSize: '1.4 MB', uploadedAt: '2025-06-15T08:30:00Z', uploadedBy: 'Fatima Sheikh', description: 'Instagram advertisement for the scam' },
      { id: 'EV-111', type: 'Chat Export', fileName: 'telegram_chat.html', fileSize: '6.8 MB', uploadedAt: '2025-06-15T09:00:00Z', uploadedBy: 'Fatima Sheikh', description: 'Complete Telegram chat with task coordinator' },
      { id: 'EV-112', type: 'Transaction Log', fileName: 'upi_history.pdf', fileSize: '1.9 MB', uploadedAt: '2025-06-15T09:30:00Z', uploadedBy: 'SI Priya Sharma', description: 'UPI transaction history showing deposits and small withdrawals' },
    ],
    timeline: [
      { id: 'TL-120', time: '06:00 PM', date: '2025-06-01', title: 'Ad Seen', description: 'Instagram ad for easy online earning spotted', type: 'contact' },
      { id: 'TL-121', time: '07:00 PM', date: '2025-06-01', title: 'Telegram Joined', description: 'Joined fraud Telegram group', type: 'communication' },
      { id: 'TL-122', time: '10:00 AM', date: '2025-06-03', title: 'Initial Tasks', description: 'Completed simple tasks, received ₹500 payment', type: 'transaction' },
      { id: 'TL-123', time: '11:00 AM', date: '2025-06-05', title: 'First Deposit', description: '₹5,000 deposited for higher-tier tasks', type: 'transaction' },
      { id: 'TL-124', time: '02:00 PM', date: '2025-06-12', title: 'Large Deposits', description: 'Multiple large deposits totaling ₹1,47,000', type: 'transaction' },
      { id: 'TL-125', time: '08:00 AM', date: '2025-06-15', title: 'FIR Filed', description: 'Complaint filed at Cyber Crime Cell, Mumbai', type: 'action' },
    ],
  },
];

// ── Dashboard Stats ───────────────────────────────────────────

export const dashboardStats: DashboardStats = {
  totalCases: 2847,
  openCases: 423,
  closedCases: 1892,
  highPriorityCases: 156,
  activeInvestigations: 532,
  totalAmountLost: 487500000,
  convictionRate: 34.5,
  avgResolutionDays: 45,
};

// ── Monthly Trends ────────────────────────────────────────────

export const monthlyTrends: MonthlyTrend[] = [
  { month: 'Jan', cases: 198, resolved: 145, pending: 53 },
  { month: 'Feb', cases: 225, resolved: 168, pending: 57 },
  { month: 'Mar', cases: 267, resolved: 198, pending: 69 },
  { month: 'Apr', cases: 312, resolved: 230, pending: 82 },
  { month: 'May', cases: 345, resolved: 245, pending: 100 },
  { month: 'Jun', cases: 289, resolved: 190, pending: 99 },
  { month: 'Jul', cases: 356, resolved: 265, pending: 91 },
  { month: 'Aug', cases: 298, resolved: 220, pending: 78 },
  { month: 'Sep', cases: 334, resolved: 260, pending: 74 },
  { month: 'Oct', cases: 387, resolved: 290, pending: 97 },
  { month: 'Nov', cases: 410, resolved: 310, pending: 100 },
  { month: 'Dec', cases: 378, resolved: 285, pending: 93 },
];

// ── Category Distribution ─────────────────────────────────────

export const categoryDistribution: CategoryDistribution[] = [
  { category: 'Investment Scam', count: 645, percentage: 22.7, color: '#ef4444' },
  { category: 'UPI Fraud', count: 578, percentage: 20.3, color: '#f59e0b' },
  { category: 'Phishing', count: 489, percentage: 17.2, color: '#3b82f6' },
  { category: 'Job Scam', count: 398, percentage: 14.0, color: '#8b5cf6' },
  { category: 'Loan App Fraud', count: 356, percentage: 12.5, color: '#ec4899' },
  { category: 'Sextortion', count: 234, percentage: 8.2, color: '#6366f1' },
  { category: 'Identity Theft', count: 89, percentage: 3.1, color: '#14b8a6' },
  { category: 'Online Shopping Fraud', count: 58, percentage: 2.0, color: '#84cc16' },
];

// ── Status Distribution ───────────────────────────────────────

export const statusDistribution: StatusDistribution[] = [
  { status: 'Open', count: 423, color: '#3b82f6' },
  { status: 'Under Investigation', count: 532, color: '#f59e0b' },
  { status: 'Evidence Collection', count: 198, color: '#8b5cf6' },
  { status: 'Pending Review', count: 145, color: '#6366f1' },
  { status: 'Escalated', count: 89, color: '#ef4444' },
  { status: 'Closed', count: 1892, color: '#10b981' },
  { status: 'Resolved', count: 568, color: '#14b8a6' },
];

// ── Recent Activities ─────────────────────────────────────────

export const recentActivities: RecentActivity[] = [
  { id: 'ACT-001', type: 'new_case', title: 'New Case Registered', description: 'CASE-2025-012: Job scam via work-from-home task fraud reported by Fatima Sheikh', timestamp: '2025-06-15T08:00:00Z', caseId: 'CASE-2025-012', user: 'SI Priya Sharma' },
  { id: 'ACT-002', type: 'alert', title: 'High Risk Entity Detected', description: 'UPI ID quickcash.collect@ybl linked to 30+ cases across multiple states', timestamp: '2025-06-15T07:30:00Z', user: 'System' },
  { id: 'ACT-003', type: 'update', title: 'Investigation Update', description: 'CASE-2025-001: Bank account freeze order obtained from court for A/C 4532xxxx1876', timestamp: '2025-06-14T16:45:00Z', caseId: 'CASE-2025-001', user: 'Inspector Rajesh Kumar' },
  { id: 'ACT-004', type: 'report', title: 'Report Generated', description: 'Monthly intelligence briefing for June 2025 published', timestamp: '2025-06-14T15:00:00Z', user: 'Inspector Vikram Singh' },
  { id: 'ACT-005', type: 'assignment', title: 'Case Reassigned', description: 'CASE-2025-005: Escalated to Inspector Arjun Reddy, Hyderabad Cyber Cell', timestamp: '2025-06-14T14:30:00Z', caseId: 'CASE-2025-005', user: 'DSP Cyber Crime' },
  { id: 'ACT-006', type: 'update', title: 'Evidence Collected', description: 'CASE-2025-006: Digital forensic analysis of suspect device completed', timestamp: '2025-06-14T12:00:00Z', caseId: 'CASE-2025-006', user: 'SI Kavitha Nair' },
  { id: 'ACT-007', type: 'new_case', title: 'New Case Registered', description: 'CASE-2025-010: High-value investment scam (₹32,00,000) via fake trading app', timestamp: '2025-06-14T10:00:00Z', caseId: 'CASE-2025-010', user: 'SI Priya Sharma' },
  { id: 'ACT-008', type: 'alert', title: 'Pattern Alert', description: 'Surge in job scam reports via Telegram channels detected — 15 complaints in 48 hours', timestamp: '2025-06-13T22:00:00Z', user: 'System' },
  { id: 'ACT-009', type: 'update', title: 'Suspect Identified', description: 'CASE-2025-002: Suspect phone number owner identified via CDR analysis', timestamp: '2025-06-13T09:20:00Z', caseId: 'CASE-2025-002', user: 'SI Priya Sharma' },
  { id: 'ACT-010', type: 'report', title: 'Case Closed', description: 'CASE-2025-007: Online shopping fraud case resolved — partial refund secured via payment gateway', timestamp: '2025-05-30T16:00:00Z', caseId: 'CASE-2025-007', user: 'Inspector Arjun Reddy' },
];

// ── Reports ───────────────────────────────────────────────────

export const reports: Report[] = [
  { id: 'RPT-001', title: 'Investment Scam Ring — Multi-State Operation Analysis', type: 'Investigation Summary', status: 'Published', caseId: 'CASE-2025-001', createdBy: 'Inspector Rajesh Kumar', createdAt: '2025-06-14T10:00:00Z', updatedAt: '2025-06-14T15:00:00Z', pageCount: 28 },
  { id: 'RPT-002', title: 'UPI Fraud Pattern Analysis — Q1 2025', type: 'Intelligence Brief', status: 'Published', createdBy: 'SI Priya Sharma', createdAt: '2025-06-10T09:00:00Z', updatedAt: '2025-06-12T14:00:00Z', pageCount: 15 },
  { id: 'RPT-003', title: 'Phishing Infrastructure — HDFC Bank Impersonation Campaign', type: 'Forensic Analysis', status: 'Approved', caseId: 'CASE-2025-003', createdBy: 'Inspector Vikram Singh', createdAt: '2025-06-08T11:00:00Z', updatedAt: '2025-06-10T16:00:00Z', pageCount: 22 },
  { id: 'RPT-004', title: 'Loan App Fraud — Chinese Connection Report', type: 'Intelligence Brief', status: 'In Review', createdBy: 'ASI Meera Patel', createdAt: '2025-06-06T08:00:00Z', updatedAt: '2025-06-14T09:00:00Z', pageCount: 18 },
  { id: 'RPT-005', title: 'Monthly Cyber Crime Review — May 2025', type: 'Monthly Review', status: 'Published', createdBy: 'Inspector Arjun Reddy', createdAt: '2025-06-01T10:00:00Z', updatedAt: '2025-06-02T12:00:00Z', pageCount: 32 },
  { id: 'RPT-006', title: 'Sextortion Network Forensic Analysis', type: 'Forensic Analysis', status: 'In Review', caseId: 'CASE-2025-006', createdBy: 'SI Kavitha Nair', createdAt: '2025-06-13T10:00:00Z', updatedAt: '2025-06-15T11:00:00Z', pageCount: 20 },
  { id: 'RPT-007', title: 'Fake Trading App — Technical Infrastructure Report', type: 'Forensic Analysis', status: 'Draft', caseId: 'CASE-2025-010', createdBy: 'SI Priya Sharma', createdAt: '2025-06-15T09:00:00Z', updatedAt: '2025-06-15T12:00:00Z', pageCount: 8 },
  { id: 'RPT-008', title: 'Compliance Audit — Digital Evidence Handling', type: 'Compliance Audit', status: 'Approved', createdBy: 'Inspector Vikram Singh', createdAt: '2025-05-20T10:00:00Z', updatedAt: '2025-05-28T14:00:00Z', pageCount: 25 },
  { id: 'RPT-009', title: 'Work-From-Home Scam — Modus Operandi Analysis', type: 'Investigation Summary', status: 'Draft', caseId: 'CASE-2025-012', createdBy: 'SI Priya Sharma', createdAt: '2025-06-15T14:00:00Z', updatedAt: '2025-06-15T16:00:00Z', pageCount: 5 },
  { id: 'RPT-010', title: 'QR Code Fraud Awareness — Training Material', type: 'Intelligence Brief', status: 'Published', createdBy: 'Inspector Rajesh Kumar', createdAt: '2025-05-15T09:00:00Z', updatedAt: '2025-05-18T12:00:00Z', pageCount: 12 },
];

// ── Investigation Alerts ──────────────────────────────────────

export const investigationAlerts: InvestigationAlert[] = [
  { id: 'ALT-001', severity: 'critical', title: 'Organized Investment Scam Ring Identified', description: 'Cross-state analysis reveals single operator behind 8 investment scam cases totaling ₹2.3 Cr losses. Server IP traced to overseas location.', timestamp: '2025-06-15T06:00:00Z', source: 'Pattern Analysis Engine', acknowledged: false },
  { id: 'ALT-002', severity: 'high', title: 'New Phishing Campaign Detected', description: 'Mass phishing SMS campaign mimicking ICICI Bank detected across 5 states. 50+ complaints received in 24 hours.', timestamp: '2025-06-15T04:30:00Z', source: 'Threat Intelligence Feed', acknowledged: false },
  { id: 'ALT-003', severity: 'high', title: 'Loan App Network Expansion', description: 'QuickCash Pro operators launched 3 new loan apps on Play Store under different developer accounts. Immediate takedown requested.', timestamp: '2025-06-14T22:00:00Z', source: 'App Store Monitoring', acknowledged: true },
  { id: 'ALT-004', severity: 'medium', title: 'Spike in Job Scam Reports', description: 'Telegram-based job scam reports increased 300% in the last 72 hours. Multiple channels using identical modus operandi.', timestamp: '2025-06-14T18:00:00Z', source: 'Complaint Analysis', acknowledged: true },
  { id: 'ALT-005', severity: 'critical', title: 'High-Value Target Alert', description: 'UPI ID quickcash.collect@ybl linked to 30+ cases with total losses exceeding ₹1.5 Cr. Payment processor notified for freeze.', timestamp: '2025-06-14T14:00:00Z', source: 'Entity Intelligence', acknowledged: false },
  { id: 'ALT-006', severity: 'low', title: 'Monthly Report Due', description: 'June 2025 monthly cyber crime review report submission deadline in 5 days.', timestamp: '2025-06-14T10:00:00Z', source: 'Administrative', acknowledged: true },
];

// ── Fraud Trends ──────────────────────────────────────────────

export const fraudTrends: FraudTrend[] = [
  { category: 'Investment Scam', currentMonth: 89, previousMonth: 72, changePercent: 23.6, trend: 'up' },
  { category: 'UPI Fraud', currentMonth: 76, previousMonth: 82, changePercent: -7.3, trend: 'down' },
  { category: 'Phishing', currentMonth: 65, previousMonth: 58, changePercent: 12.1, trend: 'up' },
  { category: 'Job Scam', currentMonth: 54, previousMonth: 35, changePercent: 54.3, trend: 'up' },
  { category: 'Loan App Fraud', currentMonth: 48, previousMonth: 52, changePercent: -7.7, trend: 'down' },
  { category: 'Sextortion', currentMonth: 32, previousMonth: 28, changePercent: 14.3, trend: 'up' },
];

// ── User Profile ──────────────────────────────────────────────

export const currentUser: UserProfile = {
  id: 'USR-001',
  name: 'Inspector Rajesh Kumar',
  email: 'rajesh.kumar@cybercrime.gov.in',
  role: 'Senior Investigation Officer',
  department: 'Cyber Crime Investigation Cell, Delhi Police',
  phone: '+91-98765-00001',
  joinedAt: '2020-03-15',
};

// ── Notification Preferences ──────────────────────────────────

export const notificationPreferences: NotificationPreference[] = [
  { id: 'NP-001', label: 'New Case Assignments', description: 'Get notified when a new case is assigned to you', email: true, push: true, sms: false },
  { id: 'NP-002', label: 'Case Status Updates', description: 'Notifications when case status changes', email: true, push: true, sms: false },
  { id: 'NP-003', label: 'High Priority Alerts', description: 'Immediate alerts for critical and high priority cases', email: true, push: true, sms: true },
  { id: 'NP-004', label: 'Investigation Reports', description: 'Notifications when reports are generated or approved', email: true, push: false, sms: false },
  { id: 'NP-005', label: 'Entity Intelligence', description: 'Alerts when linked entities appear in new cases', email: true, push: true, sms: false },
  { id: 'NP-006', label: 'System Announcements', description: 'Platform updates and maintenance notifications', email: true, push: false, sms: false },
];

// ── Re-export formatting utilities ────────────────────────────

export { formatINR, formatDate, formatDateTime, timeAgo } from '@/lib/formatters';

